# dev.api.client.rationfit.com → client-api on 127.0.0.1:3028
#
#   scp this to /etc/nginx/sites-available/dev.api.client.rationfit.com
#   ln -s ../sites-available/dev.api.client.rationfit.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#
# Certificate first — see README.md in this directory for the order.
#
# The port must equal CLIENT_API_PORT in ../.env.prod. The container publishes
# it on 127.0.0.1 only, so this vhost is the sole way in.

server {
    listen 80;
    listen [::]:80;
    server_name dev.api.client.rationfit.com;
    server_tokens off;

    # ⚠️ The redirect lives in `location /`, NOT at server level. A
    # server-level `return 301` runs in the rewrite phase for every request,
    # this challenge path included — which is why renewals quietly start
    # failing three months after everything looked fine.
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
    server_name dev.api.client.rationfit.com;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/dev.api.client.rationfit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.api.client.rationfit.com/privkey.pem;
    # Written by certbot itself, and it keeps them current — TLS 1.2 + 1.3
    # with a modern cipher list, rather than a list pasted here that ages.
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=15768000" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ── /metrics MUST NOT be public ────────────────────────────────────
    # Nothing guards it in the app: Prometheus reaches it over the internal
    # docker network. Exposed here it publishes route names, traffic volumes
    # and runtime internals to anyone who asks.
    location = /metrics {
        return 404;
    }

    # Swagger stays open on this dev host — it is what the mobile developers
    # read. On a public deployment, uncomment.
    # location /docs {
    #     return 404;
    # }

    location / {
        proxy_pass http://127.0.0.1:3028;
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

    # File bytes never pass through the API — the client uploads straight to
    # object storage with a presigned URL — so this stays small on purpose.
    client_max_body_size 2m;
}
