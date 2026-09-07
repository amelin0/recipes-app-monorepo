# dev.grafana.rationfit.com → Grafana on 127.0.0.1:3030
#
#   scp this to /etc/nginx/sites-available/dev.grafana.rationfit.com
#   ln -s ../sites-available/dev.grafana.rationfit.com /etc/nginx/sites-enabled/
#   nginx -t && systemctl reload nginx
#
# The port must equal GRAFANA_HTTP_PORT in ../.env.obs, and this URL must
# equal GRAFANA_ROOT_URL there — Grafana builds its own redirects and alert
# links from that value, so a stale one sends people to localhost.
#
# There is deliberately NO vhost for Prometheus. It has no authentication at
# all: the UI runs arbitrary queries and its admin API can delete series.
# Reach it with `ssh -L 9090:127.0.0.1:3031 <host>`, or from Grafana Explore.

server {
    listen 80;
    listen [::]:80;
    server_name dev.grafana.rationfit.com;
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
    server_name dev.grafana.rationfit.com;
    server_tokens off;

    ssl_certificate     /etc/letsencrypt/live/dev.grafana.rationfit.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.grafana.rationfit.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Grafana is a login page on the public internet. These cost nothing.
    add_header Strict-Transport-Security "max-age=15768000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Dashboards with many panels can render large payloads.
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Explore queries over a wide time range take a while.
        proxy_read_timeout 120s;
    }

    # Grafana Live (dashboard streaming) needs a WebSocket upgrade; without
    # this block panels silently stop refreshing in real time.
    location /api/live/ {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host       $host;
    }
}
