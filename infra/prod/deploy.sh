#!/usr/bin/env bash
#
# Build, migrate, swap, verify — and put the previous images back if the new
# ones do not come up healthy.
#
#   ./infra/prod/deploy.sh                 # pull, build from HEAD, deploy
#   ./infra/prod/deploy.sh --no-pull       # deploy the working tree as it is
#   ./infra/prod/deploy.sh --no-cache      # rebuild ignoring the layer cache
#   ./infra/prod/deploy.sh --tag a1b2c3d   # deploy an already-built tag (rollback)
#   ./infra/prod/deploy.sh --ref development
#                                          # fetch and deploy that branch —
#                                          # what the Actions workflow calls
#
# Run it from anywhere in the repo: it finds the root itself, because the
# docker build context has to be the root and nothing else works.
#
# ─────────────────────────────────────────────────────────────────────────
# WHAT ROLLBACK DOES AND DOES NOT COVER
#
# Rolling back restores the CONTAINERS, not the SCHEMA. Migrations run before
# the swap and are forward-only, so a rollback leaves the previous build
# talking to a newer database. That is fine for an additive migration and
# wrong for a destructive one — which is the real argument for keeping
# migrations additive rather than for making this script cleverer.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

PULL=1
NO_CACHE=''
EXPLICIT_TAG=''
REF=''

while [ $# -gt 0 ]; do
    case "$1" in
        --no-pull) PULL=0 ;;
        --no-cache) NO_CACHE='--no-cache --pull' ;;
        --ref)
            REF="${2:-}"
            [ -n "$REF" ] || {
                echo "--ref needs a value" >&2
                exit 1
            }
            shift
            ;;
        --tag)
            EXPLICIT_TAG="${2:-}"
            [ -n "$EXPLICIT_TAG" ] || {
                echo "--tag needs a value" >&2
                exit 1
            }
            shift
            ;;
        -h | --help)
            sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo "unknown option: $1 (try --help)" >&2
            exit 1
            ;;
    esac
    shift
done

ROOT="$(git rev-parse --show-toplevel)"
PROD="$ROOT/infra/prod"
ENV_FILE="$PROD/.env.prod"
COMPOSE=(docker compose -p dns-prod --env-file "$ENV_FILE" -f "$PROD/docker-compose.prod.yml")

HEALTH_TIMEOUT=120

[ -f "$ENV_FILE" ] || {
    echo "missing $ENV_FILE — copy env.prod.example and fill it in" >&2
    exit 1
}

# The trailing `|| true` is load-bearing: grep exits 1 when the key is absent,
# and under `set -e` + `pipefail` that kills the script mid-assignment with no
# message at all. Several of these keys are legitimately optional.
# `cut -f2-` keeps everything after the first `=`, so a password containing an
# equals sign survives.
read_env() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'"' ' || true; }

write_tag() {
    if grep -qE '^IMAGE_TAG=' "$ENV_FILE"; then
        sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=$1|" "$ENV_FILE"
    else
        printf '\nIMAGE_TAG=%s\n' "$1" >>"$ENV_FILE"
    fi
}

CLIENT_PORT="$(read_env CLIENT_API_PORT)"
ADMIN_PORT="$(read_env ADMIN_API_PORT)"
CLIENT_PORT="${CLIENT_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"

IMAGE_REPO="$(read_env IMAGE_REPO)"
ADMIN_IMAGE_REPO="$(read_env ADMIN_IMAGE_REPO)"
IMAGE_REPO="${IMAGE_REPO:-dns/client-api}"
ADMIN_IMAGE_REPO="${ADMIN_IMAGE_REPO:-dns/admin-api}"

# Captured before anything overwrites it — this is the rollback target.
PREVIOUS_TAG="$(read_env IMAGE_TAG)"

cd "$ROOT"

# ── 1. source ────────────────────────────────────────────────────────────
if [ -n "$EXPLICIT_TAG" ]; then
    TAG="$EXPLICIT_TAG"
    echo "── deploying existing tag $TAG (no build)"
    for image in "$IMAGE_REPO:$TAG" "$IMAGE_REPO-migrator:$TAG" "$ADMIN_IMAGE_REPO:$TAG"; do
        docker image inspect "$image" >/dev/null 2>&1 || {
            echo "image $image is not on this host — nothing to deploy" >&2
            exit 1
        }
    done
else
    if [ "$PULL" -eq 1 ]; then
        # A dirty tree means the sha would name a build that is not what the
        # sha contains — the one thing that makes a tag untrustworthy.
        if [ -n "$(git status --porcelain)" ]; then
            echo "working tree is dirty — commit, stash, or use --no-pull deliberately" >&2
            exit 1
        fi
        if [ -n "$REF" ]; then
            # `checkout -B` rather than `pull`: CI names the branch it wants,
            # and the box may be sitting on a different one — or on a commit
            # somebody reset by hand. This lands exactly on what origin has.
            echo "── 1/6  fetch $REF"
            git fetch origin "$REF"
            git checkout -B "$REF" FETCH_HEAD
        else
            echo "── 1/6  git pull"
            git pull --ff-only
        fi
    fi

    TAG="$(git rev-parse --short HEAD)"
    echo "── 2/6  build $TAG"
    # shellcheck disable=SC2086
    docker build $NO_CACHE -f infra/docker/api.Dockerfile \
        --build-arg APP_PKG=@dns/client-api --build-arg APP_DIR=apps/client-api \
        -t "$IMAGE_REPO:$TAG" .
    # shellcheck disable=SC2086
    docker build $NO_CACHE -f infra/docker/api.Dockerfile --target migrator \
        --build-arg APP_PKG=@dns/client-api --build-arg APP_DIR=apps/client-api \
        -t "$IMAGE_REPO-migrator:$TAG" .
    # shellcheck disable=SC2086
    docker build $NO_CACHE -f infra/docker/api.Dockerfile \
        --build-arg APP_PKG=@dns/admin-api --build-arg APP_DIR=apps/admin-api \
        -t "$ADMIN_IMAGE_REPO:$TAG" .
fi

write_tag "$TAG"

# ── 2. migrations, BEFORE the swap ───────────────────────────────────────
# A failure here has to stop the deploy while the old containers are still
# serving — which is the whole reason this is not part of the app's startup.
echo "── 3/6  migrations"
if ! "${COMPOSE[@]}" --profile migrate run --rm migrator; then
    echo >&2
    echo "migrations failed — nothing was swapped, the previous build is still serving." >&2
    write_tag "$PREVIOUS_TAG"
    exit 1
fi

# ── 3. swap ──────────────────────────────────────────────────────────────
echo "── 4/6  up"
"${COMPOSE[@]}" up -d

# ── 4. verify ────────────────────────────────────────────────────────────
wait_healthy() {
    local label=$1 url=$2 deadline
    deadline=$(($(date +%s) + HEALTH_TIMEOUT))
    while [ "$(date +%s)" -lt "$deadline" ]; do
        if curl -fsS -o /dev/null --max-time 3 "$url"; then
            echo "    $label ok"
            return 0
        fi
        sleep 3
    done
    echo "    $label did NOT come up within ${HEALTH_TIMEOUT}s" >&2
    return 1
}

echo "── 5/6  health"
HEALTHY=1
# /health/ready, not /health: the latter answers ok with a dead database, so it
# would call a deploy good that cannot serve a single request.
wait_healthy client-api "http://127.0.0.1:$CLIENT_PORT/api/v1/health/ready" || HEALTHY=0
wait_healthy admin-api "http://127.0.0.1:$ADMIN_PORT/api/v1/health" || HEALTHY=0

if [ "$HEALTHY" -eq 0 ]; then
    echo >&2
    "${COMPOSE[@]}" logs --tail 40 client-api admin-api >&2 || true
    echo >&2

    if [ -z "$PREVIOUS_TAG" ] || ! docker image inspect "$IMAGE_REPO:$PREVIOUS_TAG" >/dev/null 2>&1; then
        echo "DEPLOY FAILED and there is no previous image to fall back to." >&2
        echo "The new containers are up but unhealthy — fix forward." >&2
        exit 1
    fi

    echo "rolling back to $PREVIOUS_TAG" >&2
    write_tag "$PREVIOUS_TAG"
    "${COMPOSE[@]}" up -d

    if wait_healthy client-api "http://127.0.0.1:$CLIENT_PORT/api/v1/health/ready"; then
        echo >&2
        echo "rolled back to $PREVIOUS_TAG and healthy." >&2
        echo "NOTE: the migrations from $TAG were applied and are NOT undone —" >&2
        echo "the previous build is running against the newer schema." >&2
    else
        echo "ROLLBACK ALSO UNHEALTHY — this is an outage, look at the logs above." >&2
    fi
    exit 1
fi

# ── 5. done ──────────────────────────────────────────────────────────────
echo "── 6/6  deployed $TAG"
"${COMPOSE[@]}" ps

if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$TAG" ]; then
    echo
    echo "previous was $PREVIOUS_TAG — roll back with:"
    echo "    $0 --tag $PREVIOUS_TAG"
fi

echo
echo "old images accumulate at ~460MB (api) and ~715MB (migrator) per deploy,"
echo "and dns-disk-low alerts at 15% free:"
echo "    docker image prune -f"
