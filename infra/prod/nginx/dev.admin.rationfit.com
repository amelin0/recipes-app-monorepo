# dev.admin.rationfit.com → the admin panel, as static files
#
#   scp this to /etc/nginx/sites-available/dev.admin.rationfit.com
#   ln -s ../sites-available/dev.admin.rationfit.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#
# No proxy_pass and no Node process. `next build` runs with
# `output: 'export'`, so the panel is a directory of HTML, JS and CSS —
# every screen is client-rendered and every byte of data comes from the admin
# API over HTTP. A server whose only job is to hand back HTML that JavaScript
# replaces immediately would be one more thing to keep running.
#
# ⚠️ `NEXT_PUBLIC_API_URL` is inlined at BUILD time. Pointing the panel at a
# different API means rebuilding and re-publishing, not restarting anything —
# there is nothing to restart.
#
# Publishing is `infra/prod/publish-web.sh`, which builds and swaps the
# directory atomically.

server {
    listen 80;
    listen [::]:80;
    server_name dev.admin.rationfit.com;
    server_tokens off;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.admin.rationfit.com;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/dev.admin.rationfit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.admin.rationfit.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=15768000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # The symlink `publish-web.sh` flips. Swapping the link rather than the
    # files means a deploy is atomic: nobody is served half a build.
    root /var/www/dns-admin/current;
    index index.html;

    # Content-hashed under /_next/static, so it can be cached forever. Getting
    # this wrong the other way — caching the HTML — is what serves a stale
    # panel that loads chunks the new build no longer has.
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # HTML must never be cached: it is what points at the current chunk names.
    location ~* \.html$ {
        add_header Cache-Control "no-store";
    }

    location / {
        # `trailingSlash: true` in next.config.ts means every route is a
        # directory with an index.html, so this needs no rewrite rules.
        # The final 404 is deliberate rather than an SPA fallback: the export
        # has a real page for every route, and silently serving index.html for
        # a typo would hide broken links behind a working-looking panel.
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # Nothing is posted to nginx here — the panel talks to the API directly.
    client_max_body_size 1m;
}
