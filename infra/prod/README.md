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

Шаблони в `nginx/`. Один піддомен на API і один на Grafana.

**`/metrics` мусить бути закритий назовні.** У застосунку його ніщо не
охороняє — Prometheus ходить внутрішньою мережею. Відкритий публічно, він
публікує імена маршрутів, обсяги трафіку і внутрішній стан процесу.
`client-api.conf.example` повертає на нього 404.

Grafana слухає лише `127.0.0.1:3300`; nginx — єдиний шлях до неї.

## Що з чим зʼєднано

`service` — єдина мітка, яка тримає логи й метрики разом:

- Prometheus скрейпить `client-api:3000` **за іменем compose-сервісу**;
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

## Чого тут немає

- **Скриптів деплою і відкату.** Кроки вище — рукою; автоматизувати варто
  разом із CI.
- **Правил алертингу.** Датасорси й дашборд провізіоняться, алерти — ні:
  канал сповіщень (Telegram, пошта) ще не обрано.
- **Бекапів Postgres.** База поза Docker, тож і бекап поза цим стеком.
- **Метрик в `admin-api`.** Модуль метрик є лише в `client-api`; admin-api
  поки має два маршрути й проба на нього — це просто `/health`.
