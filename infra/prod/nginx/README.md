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
| `dev.admin.rationfit.com` | адмінка (`@dns/web`) | — | статика з `/var/www/dns-admin/current` |

Адмінка **не проксіюється** — це каталог файлів. `next build` іде з
`output: 'export'`, бо SSR тут не використовується взагалі: жодної
`async`-сторінки, жодних server actions, сесія в `localStorage`, усі дані по
HTTP. Публікує `../publish-web.sh`; шлях у vhost — симлінк, який той скрипт
перемикає, тож викладка атомарна.

Для Prometheus vhost теж немає **свідомо**: у нього нуль автентифікації, а
admin-API вміє видаляти серії. Доступ — `ssh -L 9090:127.0.0.1:3031 <host>`
або Grafana Explore.

## Встановлення

A-записи всіх чотирьох хостів мають вказувати на сервер **до** запуску —
HTTP-01 інакше не пройде, а Let's Encrypt обмежує кількість невдалих спроб.

```bash
apt install nginx certbot          # якщо ще немає
git clone <repo> && cd <repo>      # або scp усієї теки nginx/
sudo infra/prod/nginx/install.sh oleh.cherednik@gmail.com
```

Скрипт ідемпотентний і **безпечний на сервері, який уже обслуговує**:
сертифікат, що існує, не перевидається, а ACME-bootstrap пишеться **лише для
хостів без сертифіката**. Раніше він називав усі — і оскільки `sites-enabled`
читається за абеткою, `00-acme-bootstrap` вигравав збіг `server_name` і
забирав `:80` у робочих vhost'ів на час прогону.

Додати один піддомен до сервера, де решта вже працює:

```bash
sudo infra/prod/nginx/install.sh <email> --host dev.admin.rationfit.com
```

`--host` можна повторювати. У кроці 4 скрипт друкує `unchanged` / `updated` на
кожен файл, тож видно рівно те, що змінилося.

Що він робить:

1. Кладе тимчасовий `:80`-only блок на всі чотири імені. **Це не зайвий крок:**
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
curl -sI https://dev.admin.rationfit.com/recipes/           | head -1   # 200
curl -sI https://dev.admin.rationfit.com/nope/              | head -1   # 404
```

Останній рядок навмисний: у експорті є справжня сторінка на кожен маршрут, і
SPA-фолбек на `index.html` ховав би зламані посилання за панеллю, яка виглядає
робочою.

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

**`X-Forwarded-For` проставляється, але ключем не є.** У `api.11am.pp.ua` є
лише `X-Real-IP`. Throttler і логи читають адресу клієнта з **`X-Real-IP`**:
`proxy_set_header X-Real-IP $remote_addr` **замінює** те, що надіслав
клієнт, адресою TCP-співрозмовника nginx, тож підробити її не можна. Без
цього рядка всі запити виглядають як від nginx, і один агресивний клієнт
вичерпує ліміт 60/хв на всіх одразу; із заголовком, пропущеним від клієнта як
є, кожен запит сам обирав би собі кошик ліміту. `X-Forwarded-For` —
`$proxy_add_x_forwarded_for` **дописує** до списку клієнта, тож перший елемент
у ньому — що завгодно; він лише для журналу входів адмінки.

Це тримається на тому, що API-порти опубліковані тільки на `127.0.0.1`
(`../docker-compose.prod.yml`): nginx — єдиний вхід. Відкрити порт назовні чи
поставити перед API проксі, що пропускає `X-Real-IP` від клієнта, — зламати
ліміти запитів.

Решта — їхній формат: `server_tokens off`, HSTS, редирект :80 → :443. Набір
шифрів не переписаний вручну, а взятий із `options-ssl-nginx.conf`, який
certbot оновлює сам; інлайновий список у `api.11am.pp.ua` фіксує TLSv1.2 і
старіє мовчки.
