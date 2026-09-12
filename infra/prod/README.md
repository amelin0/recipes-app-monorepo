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

Адмінка порту не має взагалі: це статика, яку nginx віддає з диска. Див.
«Адмінка» нижче.

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

# 3. Спостережуваність. Каталог — від користувача, під яким іде деплой:
#    інакше Docker створить його root-ом, і deploy.sh не зможе туди писати.
mkdir -p textfile
docker compose -p dns-obs --env-file .env.obs -f docker-compose.obs.yml up -d
```

`deploy.sh` сам повідомляє про старт і результат у той самий Telegram-чат, що
й алерти (токен — з `.env.obs`, chat id — з `contact-points.yml`), і пише
результат у `textfile/deploy.prom`. З нього правило `dns-deploy-failed`
нагадує про невдалий деплой, доки наступний не пройде. Обидва канали
best-effort: без токена чи без каталогу деплой іде як завжди, лише мовчки.

`--env-file` обовʼязковий у **кожній** команді до цих стеків, включно з `ps`
і `logs`: compose автоматично читає лише файл, який називається рівно `.env`,
а `:?`-гварди в compose-файлах зупиняють інтерполяцію ще до запуску.

### Перший адмін

Панель не має реєстрації, тож на чистій базі є форма входу і нікого, хто міг
би нею скористатися. Заповніть `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` у
`.env.prod` і виконайте тим самим міграторним образом:

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml   --profile migrate run --rm migrator node_modules/.bin/tsx src/seeds/seed-admin.ts
```

Ідемпотентно, і навмисно **не** перезаписує пароль наявного акаунта: повторний
сід не має бути способом захопити чужий доступ. Після створення змінні можна
прибрати з `.env.prod` — вони більше нікому не потрібні.

### Мок-рецепти

Міграції засівають довідники, але не самі страви — у `recipes` після міграцій
нуль рядків, і список рецептів у застосунку буде порожній. Шість мок-страв
кладе окремий сід:

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \n  --profile migrate run --rm migrator node_modules/.bin/tsx src/seeds/seed.ts
```

Ідемпотентний — повторний запуск нічого не змінює. Це **риштування, не
контент**: справжні рецепти прийдуть імпортом з адмінки, і тоді ці шість
знімаються двома рядками (спершу страви — `recipe_ingredients` тримає
продукти через `ON DELETE RESTRICT`):

```sql
delete from recipes  where id::text like '5eed%';
delete from products where id::text like '5eed%';
```

## Повторний деплой

```bash
./infra/prod/deploy.sh                 # pull, збірка з HEAD, деплой
./infra/prod/deploy.sh --no-pull       # зібрати робоче дерево як є
./infra/prod/deploy.sh --no-cache      # ігнорувати кеш шарів
./infra/prod/deploy.sh --tag a1b2c3d   # відкат на вже зібраний тег
```

Скрипт робить те саме, що кроки вище, плюс дві речі, які рукою забуваються:
переписує `IMAGE_TAG` у `.env.prod` і **перевіряє, що нове піднялося**, а якщо
ні — повертає попередній тег.

Той самий скрипт викликає GitHub Actions: push у `development` запускає
`.github/workflows/deploy.yml` на **self-hosted раннері на цьому ж сервері**,
і тіло job'а — рівно один рядок `deploy.sh --ref development`. Друга
реалізація в YAML — це те, як вони тихо розходяться, і помітно це стає під час
інциденту. Підключення раннера — [`docs/runbooks/register-actions-runner.md`](../../docs/runbooks/register-actions-runner.md).

Порядок навмисний: міграції **до** підміни контейнерів, тож падіння там
зупиняє деплой, поки стара збірка ще обслуговує.

Здоровʼя перевіряється по `/health/ready`, не `/health`: другий відповів би
`ok` з мертвою базою і зарахував би деплой, який не може обслужити жодного
запиту.

**Відкат повертає контейнери, а не схему.** Міграції односторонні й уже
застосовані, тож після відкату попередня збірка працює проти новішої бази. Для
адитивної міграції це нормально, для руйнівної — ні, і це радше аргумент
тримати міграції адитивними, ніж ускладнювати скрипт.

Брудне робоче дерево скрипт відхиляє: тег = git sha, і зібрати з нього щось
інше, ніж містить цей sha, — єдине, що робить тег непридатним для відкату.

Старі образи накопичуються по ~460 МБ (API) і ~715 МБ (мігратор) за деплой, а
`dns-disk-low` спрацьовує на 15% вільного:

```bash
docker image prune -f          # чіпає лише dangling
docker images | grep dns/      # лишити 2-3 теги для відкату
```

## nginx

Готові vhost'и під dev-сервер лежать у `nginx/`, названі за хостами — див.
`nginx/README.md` (порядок із certbot і чим вони відрізняються від конфігів
11am).

| Хост | Куди |
| --- | --- |
| `dev.api.client.rationfit.com` | client-api `127.0.0.1:3028` |
| `dev.api.admin.rationfit.com` | admin-api `127.0.0.1:3029` |
| `dev.grafana.rationfit.com` | Grafana `127.0.0.1:3030` |
| `dev.admin.rationfit.com` | статика з `/var/www/dns-admin/current` |

Ставляться одним запуском — `sudo infra/prod/nginx/install.sh <email>`: він
робить bootstrap під ACME, бере сертифікати, підміняє на справжні файли й
перезавантажує nginx.

**`/metrics` мусить бути закритий назовні.** У застосунку його ніщо не
охороняє — Prometheus ходить внутрішньою мережею. Відкритий публічно, він
публікує імена маршрутів, обсяги трафіку і внутрішній стан процесу. Обидва
API-vhost'и повертають на нього 404.

Усі контейнери слухають лише `127.0.0.1`; nginx на хості — єдиний шлях до них.

## Адмінка

Панель — **статичні файли**, не процес. `next build` іде з
`output: 'export'`, бо SSR у ній не використовується: жодної `async`-сторінки,
жодних server actions, сесія в `localStorage`, усі дані по HTTP від admin-api.
Node-процес, який віддавав би HTML, що його JavaScript одразу замінює, був би
ще однією річчю, яку треба тримати запущеною і рестартувати на деплої.

```bash
sudo ./infra/prod/publish-web.sh
```

Збирає, кладе реліз у `/var/www/dns-admin/releases/<дата>-<sha>` і перемикає
симлінк `current`. Викладка атомарна: ніхто не отримає `index.html`, який
посилається на чанки, ще не скопійовані. Відкат — без перезбірки:

```bash
ln -sfn /var/www/dns-admin/releases/<назва> /var/www/dns-admin/current
```

⚠️ **`NEXT_PUBLIC_API_URL` вшивається під час збірки.** Скрипт читає його з
`.env.prod`. Перенацілити панель на інший API — це перезбірка, а не
перезапуск: перезапускати нічого.

Кешування розведене навмисно: `/_next/static/` — рік і `immutable` (імена
містять хеш), HTML — `no-store`. Навпаки було б гірше: закешований HTML
посилається на чанки, яких у новій збірці вже немає.

Останній `try_files` дає **404**, а не `index.html`. У експорті є справжня
сторінка на кожен маршрут, і SPA-фолбек ховав би зламані посилання за
панеллю, яка виглядає робочою.

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

**Обидва health-маршрути винесені з-під throttler'а** (`@SkipThrottle()`).
Проби мають спільний ключ трекера — вони йдуть від балансувальника й
моніторингу, а не від користувача, — тож nginx, blackbox і healthcheck
контейнера ділили б одні й ті самі 60/хв, і проба почала б отримувати 429.
Наслідок був би збоченим: усі роблять висновок, що сервіс лежить, а сервіс
живий.

## Алерти в Telegram

Усе під `grafana/provisioning/alerting/` — контактні точки, дерево
маршрутизації і девʼять правил у теці `DNS`, тій самій, де дашборд.

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

Перевірити, що все піднялося (10 правил, 2 контактні точки):

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
| `dns-worker-down` | warning | `up{job="worker"} == 0` — 10 хв |
| `dns-overdue-account-deletions` | warning | найстаріше прострочене видалення чекає понад 10 днів |

`critical` йде окремим маршрутом: `group_wait` 10 с і повтор щогодини проти
30 с і чотирьох годин у решти. **Алерти воркера** — ще один маршрут, із
повтором раз на добу: жоден запит користувача через ці збої не проходить, і
передзвін кожні чотири години про роботу, яка все одно чекає до понеділка,
лише навчив би людей мутити канал.

`dns-overdue-account-deletions` — єдине правило тут не про машину, а про
обіцянку. Воно читає **вік**, а не кількість: видалення виконуються ручним
тижневим рунбуком, тож ненульова кількість прострочених — нормальний стан у
вівторок, а от найстаріший запит віком у десять днів означає, що тижневий
запуск пропустили.

`noDataState` тут важливіший за поріг. Для доступності відсутність даних —
**це і є** відмова (`Alerting`). Для 5xx і затримки — ні (`OK`):
`histogram_quantile` над порожнім діапазоном о 4:00 не повертає нічого, і алерт
на це вчить усіх мутити канал.

Нічого не спрацьовує на «високий CPU» чи «памʼять зросла» — свідомо. Алерт, на
який ніхто не реагує, вчить ігнорувати наступний.

## Чого тут немає

- **Бекапів Postgres.** База поза Docker, тож і бекап поза цим стеком.
- **Метрик в `admin-api`.** Модуль метрик є лише в `client-api`; admin-api
  поки має два маршрути й проба на нього — це просто `/health`.
