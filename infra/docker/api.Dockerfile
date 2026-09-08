# syntax=docker/dockerfile:1.7
#
# Image for any of the three Nest services — both APIs and the worker.
# Build from the REPO ROOT:
#
#   docker build -f infra/docker/api.Dockerfile \
#     --build-arg APP_PKG=@dns/client-api --build-arg APP_DIR=apps/client-api \
#     -t dns/client-api:<tag> .
#
# One parameterised file rather than two nearly identical ones: the apps
# differ only in their package name and directory, and a second copy would
# drift the first time somebody fixed a build problem in only one of them.
#
# Why the runtime layer is small: each app's webpack.config.js runs
# nodeExternals({ allowlist: [/^@dns\//] }), so every workspace package is
# bundled into a single dist/main.js and only third-party packages stay
# external. The runtime therefore needs main.js plus a production node_modules
# and none of the monorepo sources.
#
# Targets:
#   runtime  (default) — node dist/main.js
#   migrator           — carries tsx and packages/database sources so the
#                        deploy can run migrations before the API is swapped.

ARG NODE_IMAGE=node:22-slim
ARG PNPM_VERSION=9.15.0

# ─────────────────────────────── base ───────────────────────────────
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
ENV PNPM_STORE=/pnpm/store
# npm i -g rather than corepack: corepack fetches and signature-verifies pnpm
# at build time, which breaks on older Node images with expired signing keys.
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# ─────────────────────────────── deps ───────────────────────────────
# Manifests only, so this layer stays cached until a package.json or the
# lockfile actually changes — the expensive install does not re-run on every
# source edit.
FROM base AS deps
ARG APP_PKG=@dns/client-api

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Every workspace importer must exist on disk for --frozen-lockfile to pass,
# even the ones --filter will never install. See .dockerignore, which drops
# their sources and keeps exactly these files.
COPY apps/client-api/package.json ./apps/client-api/
COPY apps/admin-api/package.json  ./apps/admin-api/
COPY apps/mobile/package.json     ./apps/mobile/
COPY apps/worker/package.json     ./apps/worker/
COPY apps/web/package.json        ./apps/web/
COPY packages/api-common/package.json         ./packages/api-common/
COPY packages/api-infrastructure/package.json ./packages/api-infrastructure/
COPY packages/constants/package.json          ./packages/constants/
COPY packages/database/package.json           ./packages/database/
COPY packages/shared-types/package.json       ./packages/shared-types/
COPY packages/validation/package.json         ./packages/validation/

# `<pkg>...` is the app plus its workspace dependency closure — the same
# selector the root `install:server` script uses.
# --ignore-scripts: nothing here needs a native build, and it skips the
# mobile app's postinstalls.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts \
        --store-dir ${PNPM_STORE} \
        --filter "${APP_PKG}..."

# ────────────────────────────── build ───────────────────────────────
FROM base AS build
ARG APP_PKG=@dns/client-api
ARG APP_DIR=apps/client-api

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# nest build → webpack → <app>/dist/main.js
RUN pnpm --filter "${APP_PKG}" build \
    && test -f "${APP_DIR}/dist/main.js"

# ───────────────────────────── migrator ─────────────────────────────
# Its own image because packages/database ships raw TypeScript
# ("main": "./src/index.ts") and its runner needs tsx — neither is in the
# runtime image, which carries only a bundled main.js.
#
# Note the missing --prod: tsx and drizzle-kit are devDependencies of
# @dns/database, and the migration runner is one of them. `pnpm deploy` is
# still what keeps this small — `FROM build` would drag the hoisted
# node_modules for the entire lockfile, Expo and Next included, and measure
# in gigabytes.
FROM build AS migrator-deps
RUN pnpm --filter @dns/database deploy --ignore-scripts /out-migrator \
    && test -f /out-migrator/node_modules/.bin/tsx \
    && test -d /out-migrator/src/migrations

FROM ${NODE_IMAGE} AS migrator
ENV NODE_ENV=production
# migrate.ts resolves its SQL as the relative path './src/migrations', so the
# working directory is load-bearing. DATABASE_URL comes from the environment —
# its dotenv call for ../../.env is a no-op here.
WORKDIR /app/packages/database
COPY --from=migrator-deps /out-migrator/ ./
USER node
CMD ["node_modules/.bin/tsx", "src/migrate.ts"]

# ────────────────────────────── prune ───────────────────────────────
# `pnpm install --prod` is NOT enough. This repo sets node-linker=hoisted and
# shamefully-hoist=true (.npmrc), so pnpm materialises one flat node_modules
# for the ENTIRE lockfile; --filter decides what builds, not what lands on
# disk. Expo and Next stay in the tree, and --prod only strips
# devDependencies, not foreign workspaces.
#
# `pnpm deploy` is the tool that actually resolves a single package's
# production closure into a self-contained directory.
FROM build AS prune
ARG APP_PKG=@dns/client-api
RUN pnpm --filter "${APP_PKG}" deploy --prod --ignore-scripts /out \
    && test -d /out/node_modules

# ───────────────────────────── runtime ──────────────────────────────
FROM ${NODE_IMAGE} AS runtime
ARG APP_DIR=apps/client-api
ENV NODE_ENV=production
WORKDIR /app

# From /out — the self-contained tree `pnpm deploy` produced, not the hoisted
# workspace node_modules, which carries the whole monorepo.
COPY --from=prune /out/node_modules ./node_modules
COPY --from=build /app/${APP_DIR}/dist ./dist

USER node
EXPOSE 3000

# Node 22 has global fetch, so the image needs neither curl nor wget.
# /health/ready, not /health: the latter answers ok with a dead database, and
# a container that cannot reach Postgres is not one to route traffic to.
#
# This is the fallback for a bare `docker run`. Both compose services override
# it — admin-api must, since it has no readiness route, and both APIs read the
# same .env.prod, where CLIENT_API_PORT is set and would win the || below even
# in the admin container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.CLIENT_API_PORT||process.env.ADMIN_API_PORT||3000)+'/api/v1/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
