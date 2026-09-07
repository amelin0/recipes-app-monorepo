#!/usr/bin/env bash
#
# Builds the admin panel and publishes it as static files.
#
#   ./infra/prod/publish-web.sh
#   ./infra/prod/publish-web.sh --api-url https://dev.api.admin.rationfit.com/api/v1
#
# Run it as **yourself**, not with sudo. The build has to happen as the user
# who owns the checkout — pnpm lives on that user's PATH, and building as root
# would leave root-owned .next, out and store entries that the next ordinary
# build cannot overwrite. Only the three steps that touch /var/www and nginx
# escalate, and the script does that itself.
#
# `sudo ./publish-web.sh` still works: the build is dropped back to $SUDO_USER
# through a login shell. That path is best effort — if node came from nvm,
# running the script without sudo is the reliable way.
#
# ⚠️ THE API URL IS BAKED IN AT BUILD TIME.
#
# `next build` with `output: 'export'` inlines every NEXT_PUBLIC_* value into
# the JavaScript. Pointing the panel at a different API is a rebuild, not a
# restart — there is no process to restart. That is also why this script reads
# the URL from .env.prod rather than leaving it to whatever happened to be in
# the shell.
#
# Releases are kept and swapped by symlink, so publishing is atomic — nobody is
# served an index.html that references chunks the deploy has not copied yet —
# and a rollback is one `ln -sfn` away.

set -euo pipefail

API_URL=''
while [ $# -gt 0 ]; do
    case "$1" in
        --api-url)
            API_URL="${2:-}"
            [ -n "$API_URL" ] || {
                echo "--api-url needs a value" >&2
                exit 1
            }
            shift
            ;;
        -h | --help)
            sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
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
ENV_FILE="$ROOT/infra/prod/.env.prod"
TARGET=/var/www/dns-admin
KEEP=3

# Escalate only where it is needed. Empty when already root, so the same lines
# work under `sudo ./publish-web.sh` and under a plain run.
if [ "$(id -u)" -eq 0 ]; then
    SUDO=''
else
    SUDO='sudo'
    command -v sudo >/dev/null || {
        echo "not root and no sudo — cannot write to $TARGET" >&2
        exit 1
    }
fi

# Where the build runs, and as whom.
if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
    # Started with sudo. Hand the build back to the user who owns the checkout,
    # through their **login** shell — `-i` — because a node installed by nvm,
    # corepack or volta is only on the PATH that a login sets up.
    BUILD_AS="$SUDO_USER"
    run_build() { sudo -u "$SUDO_USER" -i bash -c "cd '$ROOT' && $1"; }
else
    # The normal case: run in the environment the caller already has.
    #
    # ⚠️ Do NOT wrap this in `bash -lc`. That does not add anything — it
    # *replaces* the caller's PATH with a login shell's, and on Ubuntu a login
    # shell sources ~/.bashrc, which returns on its second line when the shell
    # is not interactive. Everything nvm and npm-prefix put there is therefore
    # invisible, and the build dies on «pnpm: command not found» in a shell
    # that had pnpm a moment earlier.
    BUILD_AS="$(id -un)"
    run_build() { (cd "$ROOT" && eval "$1"); }
fi

# Fail here rather than three steps in, and say what to do about it.
if ! run_build "command -v pnpm >/dev/null 2>&1"; then
    echo "pnpm is not on $BUILD_AS's PATH." >&2
    if [ "$(id -u)" -eq 0 ]; then
        echo "Run this as yourself instead of with sudo — it escalates the few steps that need it:" >&2
        echo "    ./infra/prod/publish-web.sh" >&2
    else
        echo "Install it for this user:  npm install -g pnpm@9.15.0" >&2
    fi
    exit 1
fi

if [ -z "$API_URL" ] && [ -f "$ENV_FILE" ]; then
    # `|| true`: the key is optional here, and under `set -e` a grep that finds
    # nothing would kill the script mid-assignment with no message.
    API_URL="$(grep -E '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
fi

if [ -z "$API_URL" ]; then
    echo "No API URL. Add NEXT_PUBLIC_API_URL to $ENV_FILE or pass --api-url." >&2
    echo "It must include the version prefix, e.g. https://dev.api.admin.rationfit.com/api/v1" >&2
    exit 1
fi

cd "$ROOT"

[ -d node_modules ] || {
    echo "node_modules is missing — run pnpm install first" >&2
    exit 1
}

echo "── 1/4  build (API: $API_URL)"
# Clean, because `out/` is not emptied between builds and a route deleted from
# the source would otherwise stay published forever.
run_build "rm -rf apps/web/out apps/web/.next"
run_build "NEXT_PUBLIC_API_URL='$API_URL' pnpm --filter @dns/web build"

[ -f apps/web/out/index.html ] || {
    echo "build produced no out/index.html — did output: 'export' get removed from next.config.ts?" >&2
    exit 1
}

RELEASE="$TARGET/releases/$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"

echo "── 2/4  copy to $RELEASE"
$SUDO mkdir -p "$RELEASE"
$SUDO cp -r apps/web/out/. "$RELEASE/"

echo "── 3/4  switch"
# -n so an existing `current` symlink is replaced rather than followed, which
# would nest the new link inside the old target.
$SUDO ln -sfn "$RELEASE" "$TARGET/current"

# nginx follows the symlink per request, so no reload is needed for the swap —
# only for a change to the vhost itself.
$SUDO nginx -t
$SUDO systemctl reload nginx

echo "── 4/4  prune"
# Keeping a few makes a rollback `ln -sfn <release> /var/www/dns-admin/current`
# with no rebuild.
$SUDO find "$TARGET/releases" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n "+$((KEEP + 1))" | while read -r old; do
    echo "    removing $(basename "$old")"
    $SUDO rm -rf "$old"
done

echo
echo "published $(basename "$RELEASE")"
echo "roll back with:  ln -sfn $TARGET/releases/<name> $TARGET/current"
