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

# ⚠️ `add_header` does not accumulate: a location that declares one **replaces**
# every header inherited from the server block. Cache-Control therefore cannot
# live in its own location — doing that silently stripped HSTS and the
# clickjacking headers from exactly the responses that need them most, the
# HTML and the JavaScript, while a plain file like /favicon.ico kept them.
#
# So the value is computed here and added once, next to the others.
# Only /_next/static is content-hashed; everything else must not be cached,
# because a stale HTML points at chunk names the new build no longer has.
map $uri $dns_admin_cache {
    default             "no-store";
    ~^/_next/static/    "public, max-age=31536000, immutable";
}

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
    add_header Cache-Control $dns_admin_cache always;

    # The symlink `publish-web.sh` flips. Swapping the link rather than the
    # files means a deploy is atomic: nobody is served half a build.
    root /var/www/dns-admin/current;
    index index.html;

    # No `add_header` here on purpose — see the note above the map. The only
    # thing this location changes is the noise: asset requests would otherwise
    # drown the access log.
    location /_next/static/ {
        access_log off;
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
