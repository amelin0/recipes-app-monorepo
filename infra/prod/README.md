# Deploy and observability

Two compose stacks, deliberately separate:

| Стек | Файл | Що в ньому |
| --- | --- | --- |
| Застосунок | `docker-compose.prod.yml` | `client-api`, `admin-api`, одноразовий `migrator` |
| Спостережуваність | `docker-compose.obs.yml` | Loki, Promtail, Prometheus, node-exporter, blackbox, Grafana |

Роздільність не косметична: моніторинг можна перезапускати й оновлювати, не
чіпаючи API, і зламана зміна в ньому не може покласти застосунок.

**Postgres тут немає.** Він живе поза Docker, і цей файл його не створює, не
мігрує і не видаляє. `DATABASE_URL` вказує, де він; якщо на тому ж хості —
через `host.docker.internal`, який працює завдяки `extra_hosts` у compose.

**Redis теж немає** — його ніхто не читає. Throttler тримає лічильники в
памʼяті процесу: для однієї репліки це нормально, і це те, що треба
виправити перед появою другої.

## Порти

nginx стоїть **на хості**, не в контейнері, тож усе публікується на
`127.0.0.1` — він дотягнеться, а ззовні жоден із цих портів не видно.

| Що | Змінна | У нас | Де ще згадується |
| --- | --- | --- | --- |
| client-api | `CLIENT_API_PORT` (`.env.prod`) | 3028 | `prometheus/prometheus.yml`, `nginx/dev.api.client.rationfit.com` |
| admin-api | `ADMIN_API_PORT` (`.env.prod`) | 3029 | `prometheus/prometheus.yml`, `nginx/dev.api.admin.rationfit.com` |
| Grafana | `GRAFANA_HTTP_PORT` (`.env.obs`) | 3030 | `nginx/dev.grafana.rationfit.com` |
| Prometheus | `PROMETHEUS_HTTP_PORT` (`.env.obs`) | 3031 | — |

Адмінки (`@dns/web`) тут немає: вона на Vercel, і `dev.admin.rationfit.com`
налаштовується CNAME'ом там, а не на цьому сервері.

У API **одне число на сервіс**: воно ж усередині контейнера, воно ж на хості.
Тому в compose немає `CLIENT_API_PORT: '3000'` у блоці `environment` — цей блок
**перекриває** `env_file`, і значення з `.env.prod` тихо ігнорувалося б, а
застосунок слухав би порт, якого публікація не віддає.

**Зміна порту API — це два файли, не один.** Prometheus не підставляє змінні
оточення в `static_configs`: `${VAR}` він скрейпив би буквально. Забути про
`prometheus.yml` — це тиха поломка: ціль просто стане `DOWN`, і за дві хвилини
прилетить `dns-api-unscrapeable`, ніби сервіс упав.

Перевірити, що обрані порти вільні:

```bash
ss -ltnp | grep -E ':(3028|3029|3030|3031)\b'   # порожньо — можна
```

**Prometheus не має жодної автентифікації**: його UI виконує довільні запити, а
admin-API вміє видаляти серії. Він навмисно без vhost — тільки тунелем
(`ssh -L 9090:127.0.0.1:3031 <host>`) або через Grafana Explore.

## Postgres, який поза Docker

Контейнер ходить у базу через `host.docker.internal`, який `extra_hosts`
розвʼязує в шлюз docker-мосту (зазвичай `172.17.0.1`). Postgres із коробки
слухає **тільки `127.0.0.1`**, тож усе виглядатиме як `connection refused` —
і це не помилка конфігурації застосунку.

```bash
# 1. Роль і база
sudo -u postgres psql -c "CREATE ROLE dns LOGIN PASSWORD 'СИЛЬНИЙ_ПАРОЛЬ';"
sudo -u postgres psql -c "CREATE DATABASE dns OWNER dns;"

# 2. Слухати міст, а не лише loopback
sudo -u postgres psql -c "SHOW config_file;"     # шлях до postgresql.conf
#   listen_addresses = 'localhost,172.17.0.1'    ← додати міст, не '*'

# 3. Пустити docker-підмережу в pg_hba.conf (поруч із postgresql.conf)
#   host  dns  dns  172.16.0.0/12  scram-sha-256

sudo systemctl restart postgresql
```

`172.16.0.0/12` покриває всі мережі, які docker роздає за замовчуванням.
`listen_addresses = '*'` теж працює, але відкриває Postgres на публічний
інтерфейс — тоді доступ мусить закривати фаєрвол, і це на один шар захисту
менше.

Перевірити ще до контейнерів:

```bash
docker run --rm --add-host=host.docker.internal:host-gateway postgres:16 \
  psql "postgresql://dns:ПАРОЛЬ@host.docker.internal:5432/dns" -c "select 1"
```

Ця команда — найшвидший спосіб відрізнити «база не пускає» від «застосунок
зламаний»: вона не залежить від жодного нашого образу.

**Нічого не валідує змінні оточення на старті.** Порожній `JWT_SECRET` не
завадить контейнеру піднятися — впаде вже логін, у рантаймі. Єдина змінна з
негайним зворотним звʼязком — `DATABASE_URL`: без неї `/health/ready` віддає
503, і контейнер не стає healthy.

## Перший запуск

```bash
docker network create dns-net          # спільна мережа обох стеків, один раз

cd infra/prod
cp env.prod.example .env.prod          # заповнити; див. коментарі у файлі
cp env.obs.example  .env.obs
```

Збірка образів — **із кореня репозиторію**, не звідси:

```bash
TAG=$(git rev-parse --short HEAD)

docker build -f infra/docker/api.Dockerfile \
  --build-arg APP_PKG=@dns/client-api --build-arg APP_DIR=apps/client-api \
  -t dns/client-api:$TAG .

docker build -f infra/docker/api.Dockerfile --target migrator \
  --build-arg APP_PKG=@dns/client-api --build-arg APP_DIR=apps/client-api \
  -t dns/client-api-migrator:$TAG .

docker build -f infra/docker/api.Dockerfile \
  --build-arg APP_PKG=@dns/admin-api --build-arg APP_DIR=apps/admin-api \
  -t dns/admin-api:$TAG .
```

Далі, у цьому порядку:

```bash
cd infra/prod
export IMAGE_TAG=$TAG                  # або впишіть у .env.prod

# 1. Міграції — ДО підміни контейнера. Падіння тут має зупинити деплой,
#    поки старий контейнер ще обслуговує.
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  --profile migrate run --rm migrator

# 2. Застосунок
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml up -d

# 3. Спостережуваність
docker compose -p dns-obs --env-file .env.obs -f docker-compose.obs.yml up -d
```

`--env-file` обовʼязковий у **кожній** команді до цих стеків, включно з `ps`
і `logs`: compose автоматично читає лише файл, який називається рівно `.env`,
а `:?`-гварди в compose-файлах зупиняють інтерполяцію ще до запуску.

## nginx

Готові vhost'и під dev-сервер лежать у `nginx/`, названі за хостами — див.
`nginx/README.md` (порядок із certbot і чим вони відрізняються від конфігів
11am).

| Хост | Куди |
| --- | --- |
| `dev.api.client.rationfit.com` | client-api `127.0.0.1:3028` |
| `dev.api.admin.rationfit.com` | admin-api `127.0.0.1:3029` |
| `dev.grafana.rationfit.com` | Grafana `127.0.0.1:3030` |

Ставляться одним запуском — `sudo infra/prod/nginx/install.sh <email>`: він
робить bootstrap під ACME, бере сертифікати, підміняє на справжні файли й
перезавантажує nginx.

**`/metrics` мусить бути закритий назовні.** У застосунку його ніщо не
охороняє — Prometheus ходить внутрішньою мережею. Відкритий публічно, він
публікує імена маршрутів, обсяги трафіку і внутрішній стан процесу. Обидва
API-vhost'и повертають на нього 404.

Усі контейнери слухають лише `127.0.0.1`; nginx на хості — єдиний шлях до них.

## Що з чим зʼєднано

`service` — єдина мітка, яка тримає логи й метрики разом:

- Prometheus скрейпить `client-api` **за іменем compose-сервісу**;
- Promtail виводить мітку `service` **з того самого імені**.

Перейменувати сервіс у `docker-compose.prod.yml` — значить тихо розʼєднати
сплеск затримки й логи, які його пояснюють. Запит у Grafana просто нічого не
поверне.

## Логи

pino пише JSON; Promtail розбирає його, перетворює числовий `level` на
`info`/`error` і бере час із поля `time`. Без цього Loki проставив би час
прийому, і після перезапуску вся черга лягла б одним сплеском у «зараз».

**Мітками стають лише малокардинальні значення** — `service`, `container`,
`level`, `env`. Ідентифікатор запиту чи користувача лишається в тілі JSON і
шукається як `| json | userId="…"`. Підняти таке в мітку — класичний спосіб
покласти Loki: один стрім на кожне значення.

Утримання — 14 днів (`loki-config.yml`), і воно **не працює** без
`compactor.retention_enabled`.

## Готовність проти живості

- `GET /api/v1/health` — процес піднятий. Нічого не перевіряє.
- `GET /api/v1/health/ready` — питає базу. **503**, коли вона недоступна.

Healthcheck контейнера і blackbox-проба дивляться на `/ready`. `/health`
відповів би `ok` із мертвою базою — саме той стан, у який балансувальник не
має слати трафік.

`/api/v1/health` рахується в глобальний ліміт 60/хв. Якщо моніторинг
пінгуватиме його частіше, почнуть прилітати 429 — тоді health треба винести
з-під throttler'а.

## Алерти в Telegram

Усе під `grafana/provisioning/alerting/` — контактна точка, дерево
маршрутизації і сім правил у теці `DNS`, тій самій, де дашборд.

Група вже вписана — `-1003784473088`, та сама, що й у 11am. Лишається одне:
покласти токен бота в `TELEGRAM_BOT_TOKEN` у `.env.obs`. Бот мусить бути
учасником групи, інакше Telegram відповість `403 bot is not a member`.

Токен береться в `@BotFather` → `/newbot`. Якщо колись знадобиться інша
група: додати туди бота, написати будь-що, тоді
`curl "https://api.telegram.org/bot<TOKEN>/getUpdates"` і взяти
`message.chat.id` — для групи він відʼємний.

**Chat id живе інлайном у `contact-points.yml`, не в змінній оточення.** Це
виглядає як недогляд, але це обхід
[grafana/grafana#69950](https://github.com/grafana/grafana/issues/69950):
Grafana підставляє `$VAR` у provisioning **після** парсингу YAML і перетипує
результат, тож відʼємний id повертається числом і валідація падає. Лапки не
рятують — їх на момент підстановки вже немає. А погана provisioning-конфігурація
кладе **весь** старт Grafana, тобто це не «зламався алерт», а «немає
моніторингу».

Правила читаються лише при старті:

```bash
docker compose -p dns-obs --env-file .env.obs -f docker-compose.obs.yml \
  up -d --force-recreate grafana
```

Звичайний `up -d` зміни у файлі не помітить. Провізіонені правила й контактні
точки в UI **тільки для читання** — редагувати тут, не там.

Перевірити, що все піднялося (7 правил, 1 контактна точка):

```bash
curl -su admin:$GRAFANA_ADMIN_PASSWORD \
  http://localhost:$GRAFANA_HTTP_PORT/api/v1/provisioning/alert-rules | jq length
curl -su admin:$GRAFANA_ADMIN_PASSWORD \
  http://localhost:$GRAFANA_HTTP_PORT/api/v1/provisioning/contact-points | jq '.[].name'
```

Кнопка «Test» на контактній точці недоступна (вона read-only) — щоб перевірити
доставку, простіше зупинити `client-api` на дві хвилини й дочекатися
`dns-api-unscrapeable`.

### Що саме дзвонить

| Правило | Рівень | Умова |
| --- | --- | --- |
| `dns-readiness-failing` | critical | `/health/ready` не 200 — 2 хв |
| `dns-api-unscrapeable` | critical | Prometheus не дістає `client-api` — 2 хв |
| `dns-disk-low` | critical | менш ніж 15% вільно — 15 хв |
| `dns-5xx-rate` | warning | понад 5% відповідей 5xx — 5 хв |
| `dns-p95-latency` | warning | p95 понад 1 с — 10 хв |
| `dns-memory-low` | warning | MemAvailable під 10% — 10 хв |
| `dns-admin-api-down` | warning | `admin-api /health` не 200 — 5 хв |

`critical` йде окремим маршрутом: `group_wait` 10 с і повтор щогодини проти
30 с і чотирьох годин у решти.

`noDataState` тут важливіший за поріг. Для доступності відсутність даних —
**це і є** відмова (`Alerting`). Для 5xx і затримки — ні (`OK`):
`histogram_quantile` над порожнім діапазоном о 4:00 не повертає нічого, і алерт
на це вчить усіх мутити канал.

Нічого не спрацьовує на «високий CPU» чи «памʼять зросла» — свідомо. Алерт, на
який ніхто не реагує, вчить ігнорувати наступний.

## Чого тут немає

- **Скриптів деплою і відкату.** Кроки вище — рукою; автоматизувати варто
  разом із CI.
- **Бекапів Postgres.** База поза Docker, тож і бекап поза цим стеком.
- **Метрик в `admin-api`.** Модуль метрик є лише в `client-api`; admin-api
  поки має два маршрути й проба на нього — це просто `/health`.
