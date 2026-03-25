# Web Deploy — Vercel

## Overview

Адмін-панель (apps/web) деплоїться на **Vercel** з кореня monorepo.

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://recipes-app-monorepo.vercel.app |
| Preview | Генерується автоматично при `pnpm deploy:web:preview` |

## Vercel Project

- **Team:** ratio-fit-dev
- **Project:** recipes-app-monorepo
- **Framework:** Next.js (auto-detected)
- **Root Directory:** monorepo root (не `apps/web`)

## Конфігурація

### vercel.json (root)

```json
{
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build:web"
}
```

**Чому з кореня, а не з apps/web:**
Vercel не має доступу до батьківських директорій при deploy. Монорепо потребує `pnpm install` з кореня щоб workspace залежності працювали.

### Environment Variables (Vercel Dashboard)

| Variable | Environment | Значення |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Production | `https://sctetzydpkkmbjbuanls.supabase.co/functions/v1` |

Додати нові: Vercel Dashboard → Project Settings → Environment Variables
Або CLI: `echo "value" | vercel env add VAR_NAME production`

## Команди

```bash
pnpm deploy:web          # Production deploy
pnpm deploy:web:preview  # Preview deploy (тимчасовий URL)
pnpm build:web           # Локальний build (перевірка перед deploy)
```

## Build Pipeline

1. `pnpm install` — встановлює всі workspace залежності
2. `pnpm build:web` → `pnpm --filter @dns/web build` → `next build`
3. Output: `apps/web/.next` → Vercel serverless functions + static

## Auto Deploy (GitHub)

Поки не налаштовано. Для активації:
1. Vercel Dashboard → Settings → Git → Connect Git Repository
2. Або: Vercel Dashboard → Settings → Login Connections → GitHub
3. Після підключення: push в `main` → auto production deploy, PR → preview deploy

## Troubleshooting

- **Build fails:** спочатку перевір `pnpm build:web` локально
- **Env vars не працюють:** `NEXT_PUBLIC_*` змінні вшиваються в build, тому після зміни потрібен redeploy
- **pnpm version mismatch:** Vercel автоматично використовує pnpm 10.x (визначає по lockfile)
