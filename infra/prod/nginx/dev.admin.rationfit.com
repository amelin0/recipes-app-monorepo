# dev.admin.rationfit.com → the admin panel (@dns/web, Next.js) on 127.0.0.1:3032
#
#   scp this to /etc/nginx/sites-available/dev.admin.rationfit.com
#   ln -s ../sites-available/dev.admin.rationfit.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#
# ⚠️ NOTHING IN THIS REPO STARTS THE ADMIN PANEL YET.
# docker-compose.prod.yml ships client-api, admin-api and the migrator — no
# web service — and the root package.json still deploys @dns/web to Vercel
# (`pnpm deploy:web`). Until something listens on 3032 this vhost answers 502.
#
# Two ways to make it real, in order of effort:
#
#   • Vercel — drop this file, point the subdomain at Vercel with a CNAME and
#     set NEXT_PUBLIC_API_URL=https://dev.api.admin.rationfit.com there.
#   • On this box — `pnpm --filter @dns/web build` then
#     `PORT=3032 pnpm --filter @dns/web start` under systemd or pm2, or a web
#     service added to the compose stack. Then this file is correct as-is.
#
# 3032 continues the block: 3028 client-api, 3029 admin-api, 3030 Grafana,
# 3031 Prometheus.

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
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
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

    # The panel talks to the API from the BROWSER, so nothing large is posted
    # here; uploads go to object storage with a presigned URL.
    client_max_body_size 2m;

    # Build output is content-hashed, so it can be cached hard and forever.
    # Next.js already sends immutable Cache-Control for this path — this only
    # stops nginx access logs from drowning in asset requests.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3032;
        proxy_set_header Host $host;
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3032;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        # Server components can render slowly on a cold start.
        proxy_read_timeout    60s;
    }
}
