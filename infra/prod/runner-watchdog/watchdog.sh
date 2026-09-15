#!/usr/bin/env bash
#
# Watchdog for the dns-dev GitHub Actions runner.
#
# Two failure modes, both observed or borrowed from a neighbour:
#
#   1. The unit is DEAD (2026-09-15: enabled but inactive after a reboot,
#      three pushes queued for hours in complete silence — every signal this
#      project has lives in deploy.sh, which a dead runner never starts).
#      The 11am-app watchdog deliberately skips this case, trusting
#      Restart=always; ours does not, because that trust is exactly what
#      failed. A dead unit is started.
#
#   2. The listener is STUCK: the unit is active, but the diag log ends in
#      broker errors with no «Listening for Jobs» after them. Detection
#      copied from the 11am-app watchdog next door. A stuck unit is
#      restarted.
#
# Never touches a runner that is mid-job (Runner.Worker alive in THIS
# runner's directory) — restarting a deploy in flight is worse than either
# failure.
#
# Installed by infra/prod/install-runner-watchdog.sh; runs as root from a
# systemd timer every 10 minutes.

set -euo pipefail

RUNNER_DIR="/home/actions/actions-runner"
SERVICE="actions.runner.amelin0-recipes-app-monorepo.dns-dev.service"
LOG_FILE="$RUNNER_DIR/watchdog.log"
STALE_ERROR_WINDOW_SEC=600

log() { echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') $*" >>"$LOG_FILE"; }

# A job is actively running — never restart mid-deploy. Scoped to this
# runner's path: the box also hosts the 11am-app runner, whose busy worker
# must not shield ours.
if pgrep -f "$RUNNER_DIR/.*Runner.Worker" >/dev/null 2>&1; then
    exit 0
fi

# Case 1: the unit is not running at all.
if ! systemctl is-active --quiet "$SERVICE"; then
    log "Runner unit is not active. Starting $SERVICE."
    systemctl start "$SERVICE"
    log "Start issued for $SERVICE."
    exit 0
fi

# Case 2: active but stuck — the newest diag log ends in broker errors.
LATEST_LOG=$(ls -t "$RUNNER_DIR"/_diag/Runner_*.log 2>/dev/null | head -n1 || true)
[ -z "$LATEST_LOG" ] && exit 0

LAST_ERROR_LINE=$(grep -n "Failed to get job message\|BrokerServer\] Catch exception" "$LATEST_LOG" | tail -n1 | cut -d: -f1 || true)
LAST_OK_LINE=$(grep -n "Listening for Jobs\|Running job:" "$LATEST_LOG" | tail -n1 | cut -d: -f1 || true)

if [ -n "$LAST_ERROR_LINE" ] && { [ -z "$LAST_OK_LINE" ] || [ "$LAST_ERROR_LINE" -gt "$LAST_OK_LINE" ]; }; then
    ERROR_TS=$(sed -n "${LAST_ERROR_LINE}p" "$LATEST_LOG" | grep -oE '^\[[0-9-]+ [0-9:]+Z' | tr -d '[')
    ERROR_EPOCH=$(date -u -d "$ERROR_TS" +%s 2>/dev/null || echo 0)
    NOW_EPOCH=$(date -u +%s)
    AGE=$((NOW_EPOCH - ERROR_EPOCH))

    if [ "$ERROR_EPOCH" -gt 0 ] && [ "$AGE" -gt "$STALE_ERROR_WINDOW_SEC" ]; then
        log "Stuck listener: last broker error at $ERROR_TS unresolved for ${AGE}s. Restarting $SERVICE."
        systemctl restart "$SERVICE"
        log "Restart issued for $SERVICE."
    fi
fi
