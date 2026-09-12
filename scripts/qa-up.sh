#!/usr/bin/env bash
#
# Isolated stand for the qa-tester agent (.claude/agents/qa-tester.md).
#
# Builds a COMMITTED revision in a separate git worktree and runs it next to
# the developer's own `pnpm dev`, sharing nothing that either side can break:
#
#   what        developer            QA stand
#   ----------  -------------------  -----------------------------------
#   code        working tree, watch  worktree at a fixed commit, built once
#   ports       3000 / 3001 / 3000x  3100 client · 3101 admin · 3102 web
#   postgres    dns_dev              dns_qa, recreated on every `up`
#   redis       db 0                 db 1, flushed on every `up`
#   minio       shared bucket        shared bucket (uploads only, harmless)
#
# Uncommitted changes are NOT part of the stand — QA tests what would ship.
#
# Everything the agent is allowed to see lands in $QA_ROOT/run: env.md (URLs,
# credentials, caveats), the OpenAPI documents, server logs, a scratch dir.
# The worktree with the sources sits next to it and the agent's guard hook
# keeps it out of reach.
#
# Usage:
#   bash scripts/qa-up.sh up [--ref <git-ref>] [--web]   build + start (default ref: HEAD)
#   bash scripts/qa-up.sh down [--purge]                 stop; --purge also drops worktree + DB
#   bash scripts/qa-up.sh status
#
# Env overrides: QA_ROOT (default: <repo>-qa next to the repo),
#                QA_REAL_THROTTLE=1 to keep the rate limits from .env.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QA_ROOT="${QA_ROOT:-${REPO}-qa}"
WT="$QA_ROOT/worktree"
RUN="$QA_ROOT/run"

CLIENT_PORT=3100
ADMIN_PORT=3101
WEB_PORT=3102
QA_DB=dns_qa
QA_RO_ROLE=dns_qa_ro
QA_REDIS_DB=1
PG_CONTAINER=dns-postgres
REDIS_CONTAINER=dns-redis
QA_ADMIN_EMAIL=qa-admin@example.com

log() { printf '\033[36m[qa]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[qa] %s\033[0m\n' "$*" >&2; exit 1; }

# Last value of KEY in the repo's .env, CR stripped. Parsed rather than
# sourced: values such as `JOBS_CLEANUP_CRON=17 3 * * *` are not valid shell.
env_get() {
    local value
    value="$(sed -n "s/^$1=//p" "$REPO/.env" | tail -n 1 | tr -d '\r')"
    value="${value%\"}"
    printf '%s' "${value#\"}"
}

# Runs a step with its output in run/logs/<name>.log; on failure shows the tail.
step() {
    local name="$1"
    shift
    log "$name ..."
    if ! "$@" >"$RUN/logs/$name.log" 2>&1; then
        tail -n 30 "$RUN/logs/$name.log" >&2
        die "$name failed — full log: $RUN/logs/$name.log"
    fi
}

port_pids() {
    if command -v taskkill >/dev/null 2>&1; then
        netstat -ano | awk -v port=":$1" '$4 == "LISTENING" && substr($2, length($2) - length(port) + 1) == port { print $5 }' | sort -u
    else
        lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null || true
    fi
}

kill_port() {
    local pid
    for pid in $(port_pids "$1"); do
        if command -v taskkill >/dev/null 2>&1; then
            # /T takes the whole tree: next dev and nest leave child processes behind.
            taskkill //PID "$pid" //T //F >/dev/null 2>&1 || true
        else
            kill "$pid" 2>/dev/null || true
        fi
    done
}

# Starts a server fully detached. `nohup … &` is not enough on Windows: the
# native process inherits Git Bash's output pipe, and whatever reads that pipe
# (a CI step, an agent's shell tool) then waits until the server exits. Node's
# spawn hands the child only the stdio it is given. Prints the child's PID.
start_bg() {
    local name="$1" dir="$2"
    shift 2
    node -e '
        const { spawn } = require("node:child_process");
        const { openSync } = require("node:fs");
        const [log, cwd, command, ...args] = process.argv.slice(1);
        const out = openSync(log, "w");
        const child = spawn(command, args, { cwd, detached: true, stdio: ["ignore", out, out], windowsHide: true });
        child.on("error", error => { console.error(`[qa] cannot start ${command}: ${error.message}`); process.exit(1); });
        if (child.pid) { process.stdout.write(String(child.pid)); child.unref(); }
    ' "$RUN/logs/$name.log" "$dir" "$@"
}

is_alive() {
    node -e 'try { process.kill(Number(process.argv[1]), 0) } catch { process.exit(1) }' "$1"
}

# Wall-clock deadline, not a loop counter: on Windows a refused connection
# itself takes seconds, so counting sleeps overshoots the timeout several times.
# 127.0.0.1 rather than localhost skips the ::1 attempt that makes it worse.
wait_http() {
    local name="$1" url="$2" timeout="$3" pid="$4" deadline=$((SECONDS + $3))
    until curl -fsS -o /dev/null --max-time 5 "$url" 2>/dev/null; do
        if ! is_alive "$pid"; then
            tail -n 30 "$RUN/logs/$name.log" >&2
            die "$name exited during startup — log: $RUN/logs/$name.log"
        fi
        if ((SECONDS >= deadline)); then
            tail -n 30 "$RUN/logs/$name.log" >&2
            die "$name did not answer $url within ${timeout}s — log: $RUN/logs/$name.log"
        fi
        sleep 2
    done
}

psql_admin() {
    docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -q -U "$PG_USER" "$@"
}

container_running() {
    [[ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" == "true" ]]
}

stop_stand() {
    kill_port "$CLIENT_PORT"
    kill_port "$ADMIN_PORT"
    kill_port "$WEB_PORT"
}

cmd_up() {
    local ref=HEAD with_web=0
    while (($#)); do
        case "$1" in
            --ref) ref="${2:?--ref needs a value}"; shift 2 ;;
            --web) with_web=1; shift ;;
            *) die "unknown option: $1" ;;
        esac
    done

    [[ -f "$REPO/.env" ]] || die "no $REPO/.env — copy .env.example first"
    container_running "$PG_CONTAINER" || die "$PG_CONTAINER is not running — docker compose up -d"
    container_running "$REDIS_CONTAINER" || die "$REDIS_CONTAINER is not running — docker compose up -d"

    PG_USER="$(env_get POSTGRES_USER)"; PG_USER="${PG_USER:-dns}"
    local pg_password pg_port dev_db
    pg_password="$(env_get POSTGRES_PASSWORD)"; pg_password="${pg_password:-dns_dev}"
    pg_port="$(env_get POSTGRES_PORT)"; pg_port="${pg_port:-5432}"
    dev_db="$(env_get POSTGRES_DB)"
    [[ "$dev_db" != "$QA_DB" ]] || die "POSTGRES_DB in .env is $QA_DB — refusing to recreate the developer's database"

    local sha
    sha="$(git -C "$REPO" rev-parse --verify --quiet "$ref^{commit}")" || die "unknown git ref: $ref"
    if [[ "$ref" == HEAD && -n "$(git -C "$REPO" status --porcelain --untracked-files=no)" ]]; then
        log "WARNING: the working tree has uncommitted changes — they are NOT in the stand"
    fi

    mkdir -p "$RUN/logs" "$RUN/scratch"
    rm -f "$RUN"/logs/*.log "$RUN"/*.openapi.json "$RUN/env.md"

    log "stopping a previous stand, if any"
    stop_stand

    if git -C "$WT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        step checkout git -C "$WT" checkout --detach --force "$sha"
    else
        step worktree git -C "$REPO" worktree add --detach "$WT" "$sha"
    fi
    cp "$REPO/.env" "$WT/.env"

    local filters=(--filter '@dns/client-api...' --filter '@dns/admin-api...' --filter '@dns/database...')
    ((with_web)) && filters+=(--filter '@dns/web...')
    step install bash -c 'cd "$1" && shift && pnpm install --frozen-lockfile --prefer-offline "$@"' _ "$WT" "${filters[@]}"
    step build-client-api pnpm -C "$WT/apps/client-api" build
    step build-admin-api pnpm -C "$WT/apps/admin-api" build

    # Process env beats both .env readers (@nestjs/config and dotenv), so the
    # copied .env supplies everything and these lines move the stand aside.
    export NODE_ENV=development
    export DATABASE_URL="postgresql://$PG_USER:$pg_password@localhost:$pg_port/$QA_DB"
    export REDIS_URL="redis://localhost:6379/$QA_REDIS_DB"
    export CLIENT_API_PORT="$CLIENT_PORT" ADMIN_API_PORT="$ADMIN_PORT"
    export OTP_DEV_CODE=000000
    # pino-pretty colours even into a file; the agent reads these logs.
    export NO_COLOR=1
    # Never mail a real inbox from QA: an empty key switches on the stub client.
    export RESEND_API_KEY=
    local throttle=real
    if [[ "${QA_REAL_THROTTLE:-0}" != 1 ]]; then
        throttle="relaxed (every limit 10000)"
        local key
        for key in $(grep -oE '^THROTTLE_[A-Z_]*LIMIT' "$REPO/.env" | sort -u); do
            export "$key=10000"
        done
    fi

    log "recreating database $QA_DB"
    psql_admin -d postgres -c "DROP DATABASE IF EXISTS $QA_DB WITH (FORCE)" >/dev/null
    psql_admin -d postgres -c "CREATE DATABASE $QA_DB" >/dev/null
    step migrate pnpm -C "$WT/packages/database" db:migrate
    step seed pnpm -C "$WT/packages/database" db:seed

    local admin_password
    admin_password="qa-$(node -e "process.stdout.write(require('crypto').randomBytes(12).toString('base64url'))")"
    step seed-admin env SEED_ADMIN_EMAIL="$QA_ADMIN_EMAIL" SEED_ADMIN_PASSWORD="$admin_password" \
        SEED_ADMIN_NAME="QA Admin" pnpm -C "$WT/packages/database" db:seed:admin

    # Read-only role for the agent's side-effect checks. Local socket auth in
    # the postgres image is trust, so `docker exec psql -U dns_qa_ro` needs no password.
    psql_admin -d "$QA_DB" >/dev/null <<SQL
DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$QA_RO_ROLE') THEN
        CREATE ROLE $QA_RO_ROLE LOGIN;
    END IF;
END \$\$;
GRANT CONNECT ON DATABASE $QA_DB TO $QA_RO_ROLE;
GRANT USAGE ON SCHEMA public TO $QA_RO_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO $QA_RO_ROLE;
SQL

    docker exec "$REDIS_CONTAINER" redis-cli -n "$QA_REDIS_DB" FLUSHDB >/dev/null

    log "starting client-api :$CLIENT_PORT and admin-api :$ADMIN_PORT"
    local client_pid admin_pid
    client_pid="$(start_bg client-api "$WT/apps/client-api" node dist/main.js)"
    admin_pid="$(start_bg admin-api "$WT/apps/admin-api" node dist/main.js)"
    wait_http client-api "http://127.0.0.1:$CLIENT_PORT/api/v1/health" 90 "$client_pid"
    wait_http admin-api "http://127.0.0.1:$ADMIN_PORT/api/v1/health" 90 "$admin_pid"

    curl -fsS "http://127.0.0.1:$CLIENT_PORT/docs-json" -o "$RUN/client-api.openapi.json"
    curl -fsS "http://127.0.0.1:$ADMIN_PORT/docs-json" -o "$RUN/admin-api.openapi.json"

    local web_line="not started (pass --web)"
    if ((with_web)); then
        log "starting web :$WEB_PORT"
        # NEXT_PUBLIC_* is inlined when the page compiles, so it must be set here.
        export NEXT_PUBLIC_API_URL="http://localhost:$ADMIN_PORT/api/v1"
        # Resolved, not assumed: .npmrc sets node-linker=hoisted, so next
        # usually sits in the root node_modules rather than the app's.
        local next_bin web_pid
        next_bin="$(node -e 'process.stdout.write(require.resolve("next/dist/bin/next", { paths: [process.argv[1]] }))' "$WT/apps/web")"
        web_pid="$(start_bg web "$WT/apps/web" node "$next_bin" dev -p "$WEB_PORT")"
        # First compile of the login page happens on this request, hence the budget.
        wait_http web "http://127.0.0.1:$WEB_PORT" 180 "$web_pid"
        web_line="http://localhost:$WEB_PORT  (talks to admin-api :$ADMIN_PORT)"
    fi

    cat >"$RUN/env.md" <<EOF
# QA stand

- Commit under test: \`$sha\` — built $(date '+%Y-%m-%d %H:%M')
- client-api: http://localhost:$CLIENT_PORT/api/v1 — contract: \`client-api.openapi.json\`
- admin-api: http://localhost:$ADMIN_PORT/api/v1 — contract: \`admin-api.openapi.json\`
- Web panel: $web_line
- Admin account (SUPER_ADMIN): \`$QA_ADMIN_EMAIL\` / \`$admin_password\`
- OTP code: \`000000\`. Email is not sent: the stub client writes each letter
  to \`logs/client-api.log\` / \`logs/admin-api.log\`.
- Test users: register your own, \`qa+<anything>@example.com\`.
- Database, read only:
  \`docker exec $PG_CONTAINER psql -U $QA_RO_ROLE -d $QA_DB -c "<SQL>"\`
  Recreated on every \`up\`: data from a previous run is gone.
- Rate limiting: $throttle.
- Not running: the background worker — scheduled jobs (cleanup, subscription
  expiry, pending-work notifications) never fire on this stand.
- Server logs: \`logs/\`. Scratch files: \`scratch/\`.
EOF

    log "stand is up — $RUN/env.md"
    cat "$RUN/env.md"
}

cmd_down() {
    local purge=0
    [[ "${1:-}" == --purge ]] && purge=1
    stop_stand
    log "stopped"
    if ((purge)); then
        PG_USER="$(env_get POSTGRES_USER)"; PG_USER="${PG_USER:-dns}"
        if container_running "$PG_CONTAINER"; then
            psql_admin -d postgres -c "DROP DATABASE IF EXISTS $QA_DB WITH (FORCE)" >/dev/null
        fi
        if git -C "$WT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
            git -C "$REPO" worktree remove --force "$WT"
        fi
        rm -rf "$RUN"
        log "purged worktree, $RUN and database $QA_DB"
    fi
}

cmd_status() {
    local name port pids
    for name in client-api:$CLIENT_PORT admin-api:$ADMIN_PORT web:$WEB_PORT; do
        port="${name#*:}"
        pids="$(port_pids "$port" | tr '\n' ' ')"
        printf '%-11s :%s  %s\n' "${name%%:*}" "$port" "${pids:-down}"
    done
    [[ -f "$RUN/env.md" ]] && { echo; cat "$RUN/env.md"; }
    return 0
}

case "${1:-}" in
    up) shift; cmd_up "$@" ;;
    down) shift; cmd_down "$@" ;;
    status) cmd_status ;;
    *) sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
