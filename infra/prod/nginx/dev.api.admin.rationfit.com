# dev.api.admin.rationfit.com → admin-api on 127.0.0.1:3029
#
#   scp this to /etc/nginx/sites-available/dev.api.admin.rationfit.com
#   ln -s ../sites-available/dev.api.admin.rationfit.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#
# The port must equal ADMIN_API_PORT in ../.env.prod.
#
# admin-api has two routes so far — /health and /docs. This vhost exists so
# the subdomain and the certificate are in place before the domain modules
# are, not because there is anything to call yet.

server {
    listen 80;
    listen [::]:80;
    server_name dev.api.admin.rationfit.com;
    server_tokens off;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    # `listen ... http2` and NOT `http2 on;` — the latter is nginx 1.25.1+
    # and is an "unknown directive" that fails nginx -t outright on anything
    # older, taking every other vhost on the box down with it.
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.api.admin.rationfit.com;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/dev.api.admin.rationfit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.api.admin.rationfit.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=15768000" always;
    add_header X-Content-Type-Options "nosniff" always;

    # admin-api exposes no metrics module yet. Denying the path anyway costs
    # nothing and means adding one later cannot accidentally publish it.
    location = /metrics {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3029;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        # X-Real-IP is what the throttler buckets anonymous requests by
        # (CustomThrottlerGuard in @dns/api-common). `proxy_set_header`
        # REPLACES whatever the client sent with the TCP peer nginx saw, so
        # the header cannot be forged — keep it that way. Drop this line and
        # every request looks like it came from nginx, so one abusive client
        # rate-limits everybody; pass a client value through and every
        # request can name its own bucket.
        proxy_set_header X-Real-IP         $remote_addr;
        # Appended to, not replaced: the first entry is whatever the client
        # wrote. Informational only (the admin sign-in journal) — never a key.
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
    }

    # Admin uploads (recipe images) go through presigned URLs the same way the
    # client's do, so nothing large travels through here either.
    client_max_body_size 2m;
}
