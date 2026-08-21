# @dns/mobile

Expo React Native app for Digital Nutrition Studio — product name **RationFit**
(bundle id / package `com.rationfit.application`, scheme `rationfit`,
phones-only, `ITSAppUsesNonExemptEncryption: false`). Architecture mirrors the
11am-app reference mobile app, but styling uses **react-native-unistyles 3**
(NOT Uniwind/className).

## Structure

```
src/
├── app/            # expo-router ONLY — route files re-export screens, zero logic
│   ├── _layout.tsx         # fonts + splash + providers + <RNToast>
│   ├── index.tsx           # auth redirect
│   └── (app)/
│       ├── _layout.tsx     # Stack.Protected auth guard
│       ├── (auth)/         # unauthenticated funnel
│       └── (tabs)/         # 5 tabs: home, recipes, meal-plan, progress, shopping-list
│                           # (liquid-glass floating AppTabBar; profile lives in the Home header)
├── data/
│   ├── remote/domains/  # HTTP calls to API (<domain>.api.ts + ENDPOINTS const)
│   └── local/domains/   # local storage per domain (auth/auth-storage.ts — tokens in SecureStore)
├── state/
│   ├── store.ts    # zustand + persist(MMKV, key 'app-storage', partialize) — composes slices
│   └── domains/    # <domain>/<domain>.slice.ts (zustand) + hooks/ (React Query hooks)
├── shared/
│   ├── services/   # http.service.ts (axios: Bearer + single-flight refresh + envelope unwrap),
│   │               # query-client/ (queryClient, Queries enum + per-domain key factories,
│   │               # invalidateQueries), storages/ (MMKV local + SecureStore secure),
│   │               # toast.service.tsx
│   ├── utils/      # Haptics, AppShare, device, formatCount, clipboard, rate-app
│   ├── helpers/    # formatCompactNumber, formatTodayHeader
│   ├── hooks/      # useDebouncedValue, useDelayedRefresh, useScrollY,
│   │               # useScrollDirection, useHapticOnScroll (Reanimated 4)
│   └── ui/
│       ├── components/  # AppScreen, AppText, Toast, PlaceholderScreen, …
│       ├── theme/       # unistyles.ts (StyleSheet.configure), colors, typography, sizes
│       └── widgets/     # AppTabBar, …
└── view/           # screens by domain: view/<domain>/<screen-kebab>/
                    #   auth/        sign-in, sign-up, forgot-password, email-verify, set-new-password
                    #   tracking/    home, goal-setup
                    #   recipe/      recipes-list, recipes-filter, recipe-search, meal-details, meal-portions
                    #   shopping-list/ shopping-list, add-product, product-amount
                    #   user/        profile
                    # <screen>/components/ = screen-only parts; reusable ones move to shared/ui
```

## Key rules

- **Screen = View + Hook**: `ScreenName.tsx` (JSX only) + `useScreenName.ts` (logic).
- Route files in `src/app/` only re-export screens from `@/view/...` — zero logic.
  `PlaceholderScreen` remains only for tabs whose screens are not designed yet.
- Barrel `index.ts` in every folder.
- Styling: `StyleSheet.create(theme => ({...}))` from `react-native-unistyles`;
  inline theme access via `useUnistyles()`. Theme = **RFDS Figma** (file
  `oLpxjnx4DEZdTv5eTyE2Hv`), NOT `.claude/knowledge/design-tokens.md` (outdated).
  - Colors (node 54617:1222, light theme): groups `branding` (primary
    `#1E2932`, accent `#5EBA12`), `semantic` (positive/negative/orange/ocean +
    light pairs, greys, disabled), `background` (screen, overlay), `active`
    (pressed states), `forms` (borders), `elements` (text — partial, extend
    from the Elements node) — `shared/ui/theme/colors.ts`.
    Tokens whose value is an app-file literal rather than an RFDS variable are
    marked as such in comments (`branding.secondary`, `accentSubtle`,
    `semantic.glassFill` / `glassSelection` for the liquid-glass tab bar).
  - Typography (node 54617:1678): Inter-only scale `display/`, `title/`,
    `body/*-reg|bold`, `supporting/` (caption, overline), `button/` (large,
    small, link, tab) — `shared/ui/theme/typography.ts`.
- Theme is registered in `src/shared/ui/theme/unistyles.ts` and imported as the
  FIRST line of `index.ts` (before `expo-router/entry`). Unistyles babel plugin
  is configured in `babel.config.js` — do not remove either.
- Toasts: `ToastService.info|success|error|warning()` from `@/shared/services`;
  never render `<Toast>` manually. Host `<RNToast config={toastConfig}>` is
  mounted in the root layout.
- Auth guard: `Stack.Protected` in `(app)/_layout.tsx` driven by
  `useStore(state => state.isAuthenticated)` (defaults to `false`, session-only: «Увійти» / email code flip it, nothing persists it until auth ships);
  sign-out everywhere via `switchAuthenticatedAction(false)` — the HTTP layer
  calls it automatically on unrecoverable 401.
- Data flow: screens → RQ hooks in `state/domains/<domain>/hooks/` → `DomainApi`
  in `data/remote/domains/` → `HttpService`. Query keys ONLY via the factories
  in `shared/services/query-client/queries.ts` — never inline arrays.
- Tokens live in SecureStore via `AuthStorage` (never in zustand persist);
  app preferences go through `writeLocalData`/`readLocalData` (MMKV).
- Env: `EXPO_PUBLIC_API_URL` (see `.env.example`, copy to `.env`).

## Screen delivery workflow

Screens arrive one at a time as Figma links (app file `yWFELMwE2byUAzu0MwsWwR`,
design system `oLpxjnx4DEZdTv5eTyE2Hv`). For each link, in order:

1. **Pull the design** — `get_design_context` on the node. Download every needed
   asset straight from Figma: icons to `assets/icons/*.svg` (strip wrapper rects,
   replace `var(--stroke-0, #hex)` with `currentColor`, keep literal hex only for
   brand marks), images to `assets/images/`. Never hand-draw an icon.
2. **Check for a repeat.** Some links re-send a screen that already exists — diff
   the design against the implementation first. If it matches, say so and move on;
   if it drifted, update the existing screen instead of creating a second one.
3. **Build pixel-perfect on the design system.** Tokens from `shared/ui/theme`
   only — no literal hex, font size, radius or spacing inside a screen. Reusable
   pieces go to `shared/ui/components` (or `widgets/`); screen-only pieces to
   `view/<domain>/<screen>/components/`. Reuse before adding: check the existing
   component set first.
4. **Localize everything** — no bare strings in JSX; keys live in
   `shared/utils/translations/locales/uk/<namespace>.json`.
5. **Verify** — `pnpm typecheck`, `pnpm lint`, prettier, then run it on the
   simulator and compare against the Figma render. When a colour or size is in
   doubt, sample pixels rather than eyeballing a downscaled screenshot.
6. **Write the spec** — `docs/specs/client/<domain>/<feature>/spec.md` describing
   the business logic (WHAT/WHY) so the backend developer can implement it:
   user stories with Given/When/Then, `FR-NNN` capabilities, entities, edge cases,
   open questions. Frontmatter `plan: null` — **spec only, never a plan.** No
   endpoints, DB tables, library names or source paths in the body (paths belong
   in `Related`). Add the row to the domain `README.md`.

Mock data lives in `<domain>.constants.ts` with a `// TODO:` naming the endpoint
that will replace it.

## Commands

```bash
pnpm dev            # expo start (dev client — Expo Go does NOT work, unistyles is a native module)
                    # port 8081 is usually held by the 11am-app reference Metro; if so start ours on
                    # another port and deep-link: rationfit://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8082
                    # (a dev client attached to the wrong Metro fails with a confusing "UniwindConfig" error)
pnpm ios            # expo run:ios -d
pnpm prebuild       # expo prebuild --clean
pnpm typecheck      # tsc --noEmit
pnpm lint           # expo lint
```
