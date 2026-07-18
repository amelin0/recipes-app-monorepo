# @dns/mobile

Expo React Native app for Digital Nutrition Studio. Architecture mirrors the
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
└── view/           # screens by domain: view/<domain>/<screen-kebab>/ — added
                    # one by one from Figma designs (does not exist yet)
```

## Key rules

- **Screen = View + Hook**: `ScreenName.tsx` (JSX only) + `useScreenName.ts` (logic).
- Route files in `src/app/` only re-export screens from `@/view/...`
  (currently they render the temporary `PlaceholderScreen` until real screens ship).
- Barrel `index.ts` in every folder.
- Styling: `StyleSheet.create(theme => ({...}))` from `react-native-unistyles`;
  inline theme access via `useUnistyles()`. Theme = **RFDS Figma** (file
  `oLpxjnx4DEZdTv5eTyE2Hv`), NOT `.claude/knowledge/design-tokens.md` (outdated).
  - Colors (node 54617:1222, light theme): groups `branding` (primary
    `#1E2932`, accent `#85E239`), `semantic` (positive/negative/orange/ocean +
    light pairs, greys, disabled), `background` (screen, overlay), `active`
    (pressed states), `forms` (borders), `elements` (text — partial, extend
    from the Elements node) — `shared/ui/theme/colors.ts`.
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
  `useStore(state => state.isAuthenticated)` (mocked `true` until auth ships);
  sign-out everywhere via `switchAuthenticatedAction(false)` — the HTTP layer
  calls it automatically on unrecoverable 401.
- Data flow: screens → RQ hooks in `state/domains/<domain>/hooks/` → `DomainApi`
  in `data/remote/domains/` → `HttpService`. Query keys ONLY via the factories
  in `shared/services/query-client/queries.ts` — never inline arrays.
- Tokens live in SecureStore via `AuthStorage` (never in zustand persist);
  app preferences go through `writeLocalData`/`readLocalData` (MMKV).
- Env: `EXPO_PUBLIC_API_URL` (see `.env.example`, copy to `.env`).

## Commands

```bash
pnpm dev            # expo start (dev client — Expo Go does NOT work, unistyles is a native module)
pnpm ios            # expo run:ios -d
pnpm prebuild       # expo prebuild --clean
pnpm typecheck      # tsc --noEmit
pnpm lint           # expo lint
```
