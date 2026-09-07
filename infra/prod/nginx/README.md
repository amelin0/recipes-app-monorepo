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
| `dev.admin.rationfit.com` | адмінка (`@dns/web`) | 3032 | **ще ніщо не слухає** — див. коментар у файлі |

Для Prometheus vhost немає **свідомо**: у нього нуль автентифікації, а
admin-API вміє видаляти серії. Доступ — `ssh -L 9090:127.0.0.1:3031 <host>`
або Grafana Explore.

## Порядок

DNS-записи мають вказувати на сервер **до** certbot — HTTP-01 інакше не
пройде.

```bash
# 1. Спершу тільки :80-блок, інакше nginx -t впаде на ще неіснуючих
#    сертифікатах. Найпростіше — дати certbot зробити все самому:
certbot --nginx \
  -d dev.api.client.rationfit.com \
  -d dev.api.admin.rationfit.com \
  -d dev.admin.rationfit.com \
  -d dev.grafana.rationfit.com

# 2. Тепер підмінити те, що написав certbot, цими файлами:
scp infra/prod/nginx/dev.* root@<host>:/etc/nginx/sites-available/

# 3. Увімкнути й перезавантажити
cd /etc/nginx/sites-enabled
for h in dev.api.client dev.api.admin dev.admin dev.grafana; do
  ln -sf ../sites-available/$h.rationfit.com .
done
nginx -t && systemctl reload nginx
```

`nginx -t` **перед** `reload` — не формальність: `reload` із поламаним
конфігом лишає стару конфігурацію жити, але `restart` уже не підніметься.

## Дві відмінності від конфігів 11am у `tmp/`

**Редирект живе в `location /`, не на рівні `server`.** У 11am
`return 301 https://...` стоїть на рівні сервера, вище за
`location ~ /.well-known`. Директиви `return` виконуються у фазі rewrite, до
того як справа доходить до вмісту локації, тож ACME-челендж теж редиректиться.
Видача сертифіката все одно проходить (certbot з плагіном `--nginx` тимчасово
переписує конфіг сам), а от `--webroot`-поновлення через три місяці тихо
падає. Тут `return` усередині `location /`, і `^~` на челенджі має пріоритет.

**`X-Forwarded-For` проставляється.** У `api.11am.pp.ua` є лише `X-Real-IP`.
Наш throttler і логи читають адресу клієнта саме з `X-Forwarded-For` — без
нього всі запити виглядають як від nginx, і один агресивний клієнт вичерпує
ліміт 60/хв на всіх одразу.

Решта — їхній формат: `server_tokens off`, HSTS, редирект :80 → :443. Набір
шифрів не переписаний вручну, а взятий із `options-ssl-nginx.conf`, який
certbot оновлює сам; інлайновий список у `api.11am.pp.ua` фіксує TLSv1.2 і
старіє мовчки.
