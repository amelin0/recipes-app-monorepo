# nginx vhosts

nginx стоїть **на хості**, не в контейнері. Контейнери публікуються тільки на
`127.0.0.1`, тож ці файли — єдиний шлях до них ззовні.

Імена файлів = імена хостів, як у `sites-available/`: копіювати без
перейменування.

| Файл | Куди | Порт | Звідки порт |
| --- | --- | --- | --- |
| `dev.api.client.rationfit.com` | client-api | 3028 | `CLIENT_API_PORT` у `../.env.prod` |
| `dev.api.admin.rationfit.com` | admin-api | 3029 | `ADMIN_API_PORT` у `../.env.prod` |
| `dev.grafana.rationfit.com` | Grafana | 3030 | `GRAFANA_HTTP_PORT` у `../.env.obs` |

**`dev.admin.rationfit.com` тут немає свідомо** — адмінка (`@dns/web`) живе на
Vercel. Піддомен налаштовується CNAME'ом у Vercel, nginx до нього не
дотичний; єдине, що треба не забути — `NEXT_PUBLIC_API_URL` у змінних проєкту
Vercel має вказувати на `https://dev.api.admin.rationfit.com`.

Для Prometheus vhost теж немає **свідомо**: у нього нуль автентифікації, а
admin-API вміє видаляти серії. Доступ — `ssh -L 9090:127.0.0.1:3031 <host>`
або Grafana Explore.

## Встановлення

A-записи всіх трьох хостів мають вказувати на сервер **до** запуску —
HTTP-01 інакше не пройде, а Let's Encrypt обмежує кількість невдалих спроб.

```bash
apt install nginx certbot          # якщо ще немає
git clone <repo> && cd <repo>      # або scp усієї теки nginx/
sudo infra/prod/nginx/install.sh oleh.cherednik@gmail.com
```

Скрипт ідемпотентний: повторний запуск не перевидає наявні сертифікати, тож
ним же зручно розкочувати правки у vhost'ах.

Що він робить:

1. Кладе тимчасовий `:80`-only блок на всі три імені. **Це не зайвий крок:**
   справжні файли посилаються на сертифікати, яких ще немає, і `nginx -t`
   впав би на них до того, як certbot встиг би щось видати.
2. `certbot certonly --webroot` — окремий сертифікат на хост, бо кожен vhost
   дивиться у свій `live/<host>/`.
3. Дописує `options-ssl-nginx.conf` і `ssl-dhparams.pem`, якщо їх немає:
   certbot кладе їх разом зі своїм nginx-плагіном, а `certonly` — не завжди.
   Кожен vhost робить `include` першого, тож брак файлу — це падіння
   `nginx -t`, не попередження.
4. Міняє bootstrap на справжні файли й симлінкує в `sites-enabled/`.
5. `nginx -t`, потім `systemctl reload nginx`.

`nginx -t` **перед** `reload` — не формальність: `reload` із поламаним
конфігом лишає стару конфігурацію жити, і поломку видно лише тоді, коли
наступний `restart` (чи ребут) уже не підніметься.

### Поновлення

Окремого налаштування не потребує. Кожен vhost віддає
`/.well-known/acme-challenge/` з `/var/www/html` на `:80` — саме те, що
certbot записав собі як спосіб валідації. Перевірити:

```bash
certbot renew --dry-run
```

### Руками, якщо скрипт не підходить

```bash
# 1. bootstrap
cat > /etc/nginx/sites-available/00-acme-bootstrap <<'EOF'
server {
    listen 80;
    server_name dev.api.client.rationfit.com dev.api.admin.rationfit.com dev.grafana.rationfit.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 404; }
}
EOF
ln -sf ../sites-available/00-acme-bootstrap /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 2. сертифікати — по одному на хост
for h in dev.api.client.rationfit.com dev.api.admin.rationfit.com dev.grafana.rationfit.com; do
  certbot certonly --webroot -w /var/www/html -d $h --agree-tos -m oleh.cherednik@gmail.com -n
done

# 3. справжні файли
rm -f /etc/nginx/sites-{enabled,available}/00-acme-bootstrap
scp infra/prod/nginx/dev.* root@<host>:/etc/nginx/sites-available/
for h in dev.api.client.rationfit.com dev.api.admin.rationfit.com dev.grafana.rationfit.com; do
  ln -sf ../sites-available/$h /etc/nginx/sites-enabled/
done
nginx -t && systemctl reload nginx
```

## Перевірка після встановлення

```bash
curl -sI https://dev.api.client.rationfit.com/api/v1/health | head -1   # 200
curl -sI https://dev.api.client.rationfit.com/metrics       | head -1   # 404
curl -sI https://dev.api.admin.rationfit.com/api/v1/health  | head -1   # 200
curl -sI https://dev.grafana.rationfit.com/login            | head -1   # 200
```

`/metrics` мусить давати саме **404**. У застосунку його ніщо не охороняє —
Prometheus ходить внутрішньою мережею; відкритий назовні, він публікує імена
маршрутів, обсяги трафіку і внутрішній стан процесу.

## Дві відмінності від конфігів 11am у `tmp/`

**Редирект живе в `location /`, не на рівні `server`.** У 11am
`return 301 https://...` стоїть на рівні сервера, вище за
`location ~ /.well-known`. Директиви `return` виконуються у фазі rewrite, до
вибору локації, тож ACME-челендж редиректиться разом з усім іншим —
перевірено на nginx 1.27: у їхній формі `/.well-known/acme-challenge/` віддає
301, у цих файлах — 200 з тілом токена. Видача сертифіката все одно проходить
(плагін `--nginx` тимчасово переписує конфіг сам), а от `--webroot`-поновлення
через три місяці тихо падає.

**`X-Forwarded-For` проставляється.** У `api.11am.pp.ua` є лише `X-Real-IP`.
Наш throttler і логи читають адресу клієнта саме з `X-Forwarded-For` — без
нього всі запити виглядають як від nginx, і один агресивний клієнт вичерпує
ліміт 60/хв на всіх одразу.

Решта — їхній формат: `server_tokens off`, HSTS, редирект :80 → :443. Набір
шифрів не переписаний вручну, а взятий із `options-ssl-nginx.conf`, який
certbot оновлює сам; інлайновий список у `api.11am.pp.ua` фіксує TLSv1.2 і
старіє мовчки.
