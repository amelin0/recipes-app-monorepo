# Як перевірити локально

> Частина [журналу бекенду](../HANDOFF.md).

```bash
docker compose up -d           # postgres:16, redis:7, minio + бакет
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm typecheck                 # 10 воркспейсів — зелено
pnpm dev:client-api            # :3000, Swagger /docs
pnpm dev:admin-api             # :3001, Swagger /docs
```

Тести:

| Команда                                      | Що                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm --filter @dns/constants test`          | 16 — Atwater, Mifflin-St Jeor, добові норми і БЖВ                                    |
| `pnpm --filter @dns/validation test`         | 63 — плюс каталог, власна страва, вікно плану, дата і одиниці списку покупок         |
| `pnpm --filter @dns/api-common test`         | 4 — форма `ApiError`, 500 без витоку                                                 |
| `pnpm --filter @dns/api-infrastructure test` | 11 — коди та перевірка власності файлів                                              |
| `pnpm --filter @dns/client-api test:db`      | 212 на цій гілці; **288** на верху стеку (#25) — плюс гонки, чеки, auth (треба docker) |
| `pnpm --filter @dns/admin-api test:db`       | 130 на цій гілці; **162** на верху стеку (#25) — плюс гонки каталогу й auth (треба docker) |
| `pnpm --filter @dns/worker test:db`          | **18** на верху стеку (#25) — прибирання, 90 днів сповіщень, підписки (треба docker)   |

Обидва суїти ходять в **одну** базу, тож ганяти їх одночасно не можна: вони
чистять таблиці один одному й зависають на блокуваннях замість падати.

QA фічі проти її специфікації — командою Claude Code, не руками:

```bash
/qa docs/specs/client/user/profile/spec.md   # стенд + агент; звіт у <repo>-qa/run/reports/
bash scripts/qa-up.sh status                 # що піднято
bash scripts/qa-up.sh down [--purge]         # зупинити; --purge — ще й worktree і dns_qa
```

Стенд живе в окремій базі `dns_qa` і на портах 31xx, тож із `test:db` і
`pnpm dev` він не перетинається — пастка «одна база» його не стосується.

Наскрізний прогін auth (перевірено вручну, `OTP_DEV_CODE=000000`):

| Крок                                   | Результат                                                        |
| -------------------------------------- | ---------------------------------------------------------------- |
| `POST /auth/register`                  | 201, код у логах stub-клієнта                                    |
| `POST /auth/verify-email`              | 200, пара токенів                                                |
| `GET /auth/me` з Bearer                | 200 з id/email/emailVerifiedAt                                   |
| `GET /auth/me` без токена              | 401                                                              |
| `POST /auth/refresh`                   | 200, нова пара                                                   |
| повтор старого refresh                 | 401 — і виданий між ними токен теж мертвий (ланцюжок відкликано) |
| невалідне тіло                         | 422 з `errors[{path,message}]`                                   |
| permit на `/auth/me` і `/auth/refresh` | 401 в обох випадках                                              |

`docker compose` цього разу піднімався: міграція застосована, 5 таблиць у
базі, db-тести проходять.
