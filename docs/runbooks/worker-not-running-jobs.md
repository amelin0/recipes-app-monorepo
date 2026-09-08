---
title: Воркер не виконує фонові задачі
severity: medium
owner: '@oncall'
last-tested: 2026-09-09
---

# Воркер не виконує фонові задачі

## When to use this

Фоновий воркер (ADR-0008) — єдиний процес у системі, чия **нормальна робота
виглядає як тиша**. Він не обслуговує запитів, тож «нічого не сталося» і
«зламався» ззовні однакові. Ознаки, за якими варто зазирнути:

- `dns_worker_job_runs_total` не зростає **більше доби** (задачі нічні: 03:17
  і 04:23 UTC);
- `up{service="worker"} == 0` у Prometheus;
- прострочені токени й коди накопичуються — `select count(*) from
  refresh_tokens where expires_at < now();` дає тисячі;
- користувачі не отримують «преміум незабаром закінчиться», хоча підписки
  добігають кінця.

Це **не** аварія: жоден користувацький запит від цього не падає. Але дві речі
тихо деградують — таблиці ростуть, а люди дізнаються про кінець підписки від
застосунку, а не від нас.

## Prerequisites

- SSH на прод-хост і доступ до `infra/prod`
- `.env.prod` на місці (`--env-file` обов'язковий для будь-якої команди)

## Steps

### 1. Чи він узагалі живий

```bash
cd infra/prod
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml ps worker redis
```

`worker` має бути `Up (healthy)`, `redis` — `Up (healthy)`.

### 2. Чи бачить він чергу

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  exec worker node -e "fetch('http://127.0.0.1:'+(process.env.WORKER_PORT||3002)+'/health').then(r=>r.json()).then(j=>console.log(JSON.stringify(j)))"
```

Здорова відповідь — `{"status":"ok","queue":{...,"delayed":2,...}}`.

**`delayed` менше двох означає, що розклад не зареєстрований.** Він
створюється на старті процесу, тож перезапуск воркера його відновить:

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  restart worker
```

**Помилка з'єднання** означає, що Redis недосяжний — дивитися крок 3.

### 3. Redis

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  exec redis redis-cli ping          # PONG
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  exec redis redis-cli info memory | grep -E "used_memory_human|maxmemory_human"
```

Пам'ять обмежена 128 МБ із політикою `noeviction` — **це навмисно**: під
евікшеном Redis тихо викидав би ключі черги, і задачі зникали б без сліду.
Якщо ліміт справді вичерпано, воркер побачить помилки запису, а не порожню
чергу; черга ж на дві нічні задачі стільки пам'яті не займає, тож повний
Redis тут означає щось інше — дивитися, хто ще в нього пише.

### 4. Що впало

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  logs --tail 200 worker | grep -E "job failed|job finished|scheduled"
```

Кожен запуск лишає рядок `job finished` із результатом
(`{"refreshTokens":N,...}` або `{"expired":N,"warned":N}`). Провал —
`job failed` із помилкою; BullMQ повторить тричі з наростаючою паузою, потім
лишить задачу у `failed` до наступної ночі.

### 5. Запустити задачу руками

Якщо чекати до ночі не можна:

```bash
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  exec redis redis-cli LPUSH bull:maintenance:wait 0   # ⚠️ НЕ так
```

Ні — черга BullMQ має власний формат, і руками в неї писати не варто.
Правильний спосіб — перезапустити воркер із тимчасово зміненим кроном:

```bash
# у .env.prod, тимчасово:
JOBS_CLEANUP_CRON=*/5 * * * *
docker compose -p dns-prod --env-file .env.prod -f docker-compose.prod.yml \
  up -d --force-recreate worker
# дочекатися рядка «job finished», повернути крон і перестворити ще раз
```

**Обидві задачі ідемпотентні** — прибирання видаляє за предикатом на час, а
попередження про підписку читає з інбокса, чи вже було сказане. Зайвий запуск
нічого не зіпсує.

## Verification

```bash
# лічильник виріс
curl -s http://127.0.0.1:9090/api/v1/query?query=dns_worker_job_runs_total | jq '.data.result'

# прострочених рядків більше немає
psql "$DATABASE_URL" -c "select count(*) from refresh_tokens where expires_at < now();"
```

## Escalation

Воркер можна лишити зупиненим на кілька днів без наслідків для користувачів:
жоден запит через нього не проходить. Що росте — таблиці токенів і кодів; що
не працює — попередження про закінчення підписки. Тобто це робота на
понеділок, а не на ніч.

**Чого воркер НЕ робить:** він не видаляє акаунти. Прострочені запити на
видалення далі виконуються руками —
[`execute-overdue-account-deletions`](./execute-overdue-account-deletions.md)
— і так буде, доки не ухвалено
[ADR-0005](../adr/0005-what-account-deletion-erases.md).

## Related

- [ADR-0008](../adr/0008-background-jobs.md) — чому окремий процес і черга
- [`execute-overdue-account-deletions`](./execute-overdue-account-deletions.md)
