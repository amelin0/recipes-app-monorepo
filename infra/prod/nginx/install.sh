#!/usr/bin/env bash
#
# Installs the dev vhosts and obtains their certificates. Idempotent: safe to
# re-run after editing a vhost, and it will not re-issue a certificate that
# already exists.
#
#   sudo ./install.sh oleh.cherednik@gmail.com
#
# The address goes to Let's Encrypt as the account contact — it is where
# expiry warnings land, so use a mailbox somebody reads.
#
# Prerequisites:
#   • the A records for all four hosts already point at this machine
#     (HTTP-01 validation fails otherwise, and Let's Encrypt rate-limits
#     repeated failures)
#   • nginx and certbot installed:  apt install nginx certbot
#
# Why the bootstrap step: the real vhosts reference certificates that do not
# exist yet, so `nginx -t` would fail if they went in first. A :80-only server
# block goes in, certbot validates against it, then the real files replace it.

set -euo pipefail

EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
    echo "usage: sudo $0 <email-for-letsencrypt>" >&2
    exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
    echo "run as root (nginx config and /etc/letsencrypt are root-owned)" >&2
    exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
HOSTS="dev.api.client.rationfit.com dev.api.admin.rationfit.com dev.admin.rationfit.com dev.grafana.rationfit.com"
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

echo "── 1/5  ACME bootstrap on :80"
mkdir -p "$WEBROOT/.well-known/acme-challenge"
cat > "$SA/00-acme-bootstrap" <<EOF
# Temporary. Written by infra/prod/nginx/install.sh and removed in step 4.
server {
    listen 80;
    listen [::]:80;
    server_name $HOSTS;
    location ^~ /.well-known/acme-challenge/ { root $WEBROOT; }
    location / { return 404; }
}
EOF
ln -sf "$SA/00-acme-bootstrap" "$SE/00-acme-bootstrap"
nginx -t
systemctl reload nginx

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
    install -m 0644 "$HERE/$h" "$SA/$h"
    ln -sf "$SA/$h" "$SE/$h"
    echo "    $h"
done

echo "── 5/5  reload"
nginx -t
systemctl reload nginx

echo
echo "done. Renewals keep working without this script: every vhost serves"
echo "/.well-known/acme-challenge/ from $WEBROOT on :80, which is what"
echo "certbot recorded as the authenticator. Check with:"
echo "    certbot renew --dry-run"
