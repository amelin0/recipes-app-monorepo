#!/usr/bin/env bash
#
# Installs the dev vhosts and obtains their certificates. Idempotent: safe to
# re-run after editing a vhost, and it will not re-issue a certificate that
# already exists.
#
#   sudo ./install.sh oleh.cherednik@gmail.com
#   sudo ./install.sh oleh.cherednik@gmail.com --host dev.admin.rationfit.com
#
# The address goes to Let's Encrypt as the account contact — it is where
# expiry warnings land, so use a mailbox somebody reads.
#
# `--host` may be repeated, and narrows the run to those names. Adding one new
# subdomain to a server that is already serving the others is exactly what it
# is for.
#
# Prerequisites:
#   • the A records for the hosts already point at this machine (HTTP-01
#     validation fails otherwise, and Let's Encrypt rate-limits repeated
#     failures)
#   • nginx and certbot installed:  apt install nginx certbot
#
# ── SAFE TO RE-RUN ON A SERVING BOX ──────────────────────────────────────
#
# A certificate that exists is never re-issued, and — the part that matters —
# the ACME bootstrap block is written **only for hosts that have no
# certificate yet**. It used to name all of them, and because `sites-enabled`
# is read alphabetically, `00-acme-bootstrap` won the `server_name` match and
# took :80 away from the working vhosts for the length of the run.
#
# Why a bootstrap is needed at all: the real vhosts reference certificates
# that do not exist yet, so `nginx -t` fails if they go in first. A :80-only
# block goes in, certbot validates against it, then the real file replaces it.

set -euo pipefail

EMAIL=''
SELECTED=''

while [ $# -gt 0 ]; do
    case "$1" in
        --host)
            SELECTED="$SELECTED ${2:-}"
            [ -n "${2:-}" ] || {
                echo "--host needs a value" >&2
                exit 1
            }
            shift
            ;;
        -h | --help)
            sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            if [ -z "$EMAIL" ]; then EMAIL="$1"; else
                echo "unexpected argument: $1 (try --help)" >&2
                exit 1
            fi
            ;;
    esac
    shift
done

if [ -z "$EMAIL" ]; then
    echo "usage: sudo $0 <email-for-letsencrypt> [--host <name>]..." >&2
    exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
    echo "run as root (nginx config and /etc/letsencrypt are root-owned)" >&2
    exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
ALL_HOSTS="dev.api.client.rationfit.com dev.api.admin.rationfit.com dev.admin.rationfit.com dev.grafana.rationfit.com"
HOSTS="${SELECTED:-$ALL_HOSTS}"
WEBROOT=/var/www/html
SA=/etc/nginx/sites-available
SE=/etc/nginx/sites-enabled

for cmd in nginx certbot openssl; do
    command -v "$cmd" >/dev/null || {
        echo "$cmd not found — apt install nginx certbot openssl" >&2
        exit 1
    }
done

for h in $HOSTS; do
    [ -f "$HERE/$h" ] || {
        echo "missing vhost file: $HERE/$h" >&2
        exit 1
    }
done

# Only the ones that still need a certificate. Naming a host that already has
# a working vhost here would hijack its :80 for the run, because
# `00-acme-bootstrap` sorts first in sites-enabled and nginx takes the first
# matching server_name.
PENDING=''
for h in $HOSTS; do
    [ -f "/etc/letsencrypt/live/$h/fullchain.pem" ] || PENDING="$PENDING $h"
done

if [ -n "$PENDING" ]; then
    echo "── 1/5  ACME bootstrap on :80 for:$PENDING"
    mkdir -p "$WEBROOT/.well-known/acme-challenge"
    cat > "$SA/00-acme-bootstrap" <<EOF
# Temporary. Written by infra/prod/nginx/install.sh and removed in step 4.
server {
    listen 80;
    listen [::]:80;
    server_name$PENDING;
    location ^~ /.well-known/acme-challenge/ { root $WEBROOT; }
    location / { return 404; }
}
EOF
    ln -sf "$SA/00-acme-bootstrap" "$SE/00-acme-bootstrap"
    nginx -t
    systemctl reload nginx
else
    echo "── 1/5  every certificate is already in place — no bootstrap needed"
fi

echo "── 2/5  certificates"
# One certificate per host, not one with three SANs: each vhost points at
# /etc/letsencrypt/live/<its own host>/.
for h in $HOSTS; do
    if [ -f "/etc/letsencrypt/live/$h/fullchain.pem" ]; then
        echo "    $h — already issued, skipping"
    else
        echo "    $h — requesting"
        certbot certonly --webroot -w "$WEBROOT" -d "$h" \
            --non-interactive --agree-tos -m "$EMAIL"
    fi
done

echo "── 3/5  TLS helper files"
# certbot ships both with its nginx plugin, but `certonly` does not always
# copy them, and every vhost `include`s the first — a missing file is an
# nginx -t failure, not a warning.
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
    echo "    writing options-ssl-nginx.conf"
    cat > /etc/letsencrypt/options-ssl-nginx.conf <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305";
EOF
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
    echo "    generating ssl-dhparams.pem (2048 bit, takes a minute)"
    openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048 2>/dev/null
fi

# The panel's vhost serves files rather than proxying, and nginx -t fails on a
# missing root. Created empty so the first publish has somewhere to land.
mkdir -p /var/www/dns-admin/releases
if [ ! -e /var/www/dns-admin/current ]; then
    mkdir -p /var/www/dns-admin/releases/placeholder
    printf '<!doctype html><title>Not published yet</title><p>Run infra/prod/publish-web.sh
'         > /var/www/dns-admin/releases/placeholder/index.html
    ln -sfn /var/www/dns-admin/releases/placeholder /var/www/dns-admin/current
fi

echo "── 4/5  real vhosts"
rm -f "$SE/00-acme-bootstrap" "$SA/00-acme-bootstrap"
for h in $HOSTS; do
    # Say which ones actually change: on a serving box the interesting line is
    # the one file that moved, not the three that did not.
    if cmp -s "$HERE/$h" "$SA/$h"; then
        echo "    $h — unchanged"
    else
        install -m 0644 "$HERE/$h" "$SA/$h"
        echo "    $h — updated"
    fi
    ln -sfn "$SA/$h" "$SE/$h"
done

echo "── 5/5  reload"
nginx -t
systemctl reload nginx

echo
echo "done. Renewals keep working without this script: every vhost serves"
echo "/.well-known/acme-challenge/ from $WEBROOT on :80, which is what"
echo "certbot recorded as the authenticator. Check with:"
echo "    certbot renew --dry-run"
