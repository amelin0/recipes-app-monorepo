#!/usr/bin/env bash
#
# Installs (or re-installs) the dns-dev runner watchdog on this box.
#
#   sudo ./infra/prod/install-runner-watchdog.sh
#
# Idempotent: copies the script and the two systemd units from
# infra/prod/runner-watchdog/, reloads systemd and (re)starts the timer.
# Run it again after changing any of the three files.

set -euo pipefail

[ "$(id -u)" -eq 0 ] || {
    echo "run with sudo — it writes to /etc/systemd/system and /home/actions" >&2
    exit 1
}

SRC="$(cd "$(dirname "$0")/runner-watchdog" && pwd)"
RUNNER_DIR=/home/actions/actions-runner

[ -d "$RUNNER_DIR" ] || {
    echo "$RUNNER_DIR does not exist — register the runner first (docs/runbooks/register-actions-runner.md)" >&2
    exit 1
}

install -m 755 "$SRC/watchdog.sh" "$RUNNER_DIR/watchdog.sh"
install -m 644 "$SRC/actions-runner-watchdog-dns.service" /etc/systemd/system/
install -m 644 "$SRC/actions-runner-watchdog-dns.timer" /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now actions-runner-watchdog-dns.timer

echo "watchdog installed:"
systemctl status actions-runner-watchdog-dns.timer --no-pager | head -5
echo
echo "next firing:"
systemctl list-timers actions-runner-watchdog-dns.timer --no-pager | head -3
