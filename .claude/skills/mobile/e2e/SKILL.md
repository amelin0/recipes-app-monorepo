---
name: e2e
description: End-to-end testing for the DNS mobile app using Maestro. Covers folder layout in `apps/mobile/maestro/`, flow / subflow structure, testID conventions on the React Native side, tag taxonomy, anti-patterns, and how to add a new flow. Triggers when adding/updating Maestro flows, debugging failing flows, deciding on testIDs, wiring CI runs, or asking how E2E works.
---

# E2E — Maestro

The DNS mobile app uses [Maestro](https://docs.maestro.dev) for end-to-end UI tests — declarative YAML, runs against the real iOS Simulator / Android emulator (or real devices via cloud).

## Folder layout (canonical)

```
apps/mobile/maestro/
├── config.yaml              # workspace defaults: strictMode, retryTapIfNoChange
├── README.md                # quick run instructions
├── flows/                   # one .yaml per user journey
│   ├── auth/
│   │   ├── sign-in.yaml
│   │   └── sign-up.yaml
│   ├── settings/
│   │   ├── open-settings.yaml
│   │   └── toggle-theme.yaml
│   └── feedback/
│       └── submit-feedback.yaml
└── subflows/                # reusable building blocks (no `tags:`, no top-level intent)
    ├── launch-app.yaml
    ├── sign-in.yaml         # parameterized via env
    └── grant-permissions.yaml
```

**Rules**:
- One **flow** = one user-visible outcome. If you can't describe its goal in one sentence, split it.
- **Subflow** = reusable mechanic (launch, login, dismiss permissions). Subflows live in `subflows/`, never in `flows/`.
- File names are kebab-case, match the human-readable goal: `submit-feedback.yaml`, not `feedback_test_v2.yaml`.
- Group flows under a `flows/<feature>/` folder when you have ≥2 in the same feature.

## Flow file shape

```yaml
# apps/mobile/maestro/flows/<feature>/<flow-name>.yaml
appId: ${MAESTRO_APP_ID}
tags:
  - smoke              # or `regression`, plus feature tag
  - <feature>          # `auth`, `settings`, `feedback`, `notifications`, …
---
- runFlow: ../../subflows/launch-app.yaml
- tapOn:
    id: 'tab-bar.you'
- assertVisible:
    id: 'you-screen.header'
- takeScreenshot: <descriptive-name>
```

The `---` separates the metadata block from the steps. `appId` references the env var (set by the runner — see `Required env`).

### Subflow shape

```yaml
# apps/mobile/maestro/subflows/sign-in.yaml
appId: ${MAESTRO_APP_ID}
---
- assertVisible:
    id: 'sign-in-screen'
- tapOn:
    id: 'sign-in.email-input'
- inputText: ${TEST_EMAIL}
- ...
```

Inputs documented as a top-of-file comment listing required env vars. Subflows do **not** carry `tags:`.

## Element selection — testID strategy

Maestro's `id` selector maps directly to React Native's `testID` prop. **Always prefer `id` over visible-text matching** — text breaks with i18n.

### testID naming convention

Use kebab-case dot-namespaced IDs: `<screen-or-feature>.<element>`:

| Element | testID |
|---|---|
| Sign-in screen container | `sign-in-screen` |
| Email input on sign-in | `sign-in.email-input` |
| Continue button on sign-in | `sign-in.continue-button` |
| Tab bar — You tab | `tab-bar.you` |
| Settings row "Theme" | `settings-row.theme` |
| Floating header back button | `header.back-button` |

Add `testID` at the **outermost interactive element** the test needs — usually the `Pressable`/`TouchableOpacity`, not the inner `Text`. For a screen container, put it on the root `<View>` so flows can `assertVisible: { id: 'screen-name' }` to confirm arrival.

### When `id` is NOT available

Fall back to visible English text — keep these to a minimum and only for static labels that won't be translated mid-test (e.g. section titles in i18n keys you control):

```yaml
- assertVisible: 'Settings'
```

If the text is i18n'd and can change, **wire a testID instead**.

## Tag taxonomy

Tags drive `--include-tags` / `--exclude-tags` filtering. Use a small fixed set:

| Tag | Meaning |
|---|---|
| `smoke` | Core canary — runs in CI on every PR. Should be ≤30s wall-clock total. |
| `regression` | Full coverage — runs nightly / pre-release. Slower, broader. |
| `auth`, `settings`, `feedback`, `notifications`, `theme`, `record`, `train`, `crews`, `you` | Feature scope (one per flow, plus `smoke`/`regression`). |
| `ios-only`, `android-only` | Platform-gated flow (rare — design test to be cross-platform when possible). |
| `flaky` | Quarantined while debugging. Excluded from CI by default. |

Run examples:

```bash
maestro test --include-tags smoke maestro/flows
maestro test --include-tags settings,theme maestro/flows
maestro test --exclude-tags flaky maestro/flows
```

## Required env vars

| Name | Purpose |
|---|---|
| `MAESTRO_APP_ID` | `com.mobile.twelveam` (same id on iOS and Android) |
| `MAESTRO_CLEAR_STATE` | `true` to wipe app state on launch (default `false`) |
| `TEST_EMAIL` / `TEST_PASSWORD` | Seeded dev account; required for any flow that runs `subflows/sign-in.yaml` |

Pass via `-e KEY=val …` or shell-export before running. Never commit credentials.

## When to use which command

```yaml
# Tap on element
- tapOn:
    id: 'sign-in.continue-button'
- tapOn: 'Continue'                          # fallback to text

# Assert presence
- assertVisible:
    id: 'home-screen'
    timeout: 15000                           # ms; default 5000

# Assert absence
- assertNotVisible:
    id: 'error-banner'

# Type into focused input (focus first via tapOn)
- inputText: ${TEST_EMAIL}

# Wait for animation (use sparingly — most commands auto-wait)
- waitForAnimationToEnd

# Conditional execution
- runFlow:
    when:
      true: ${MAESTRO_PLATFORM == 'ios'}
    commands:
      - tapOn: 'Allow While Using App'

# Screenshot for debugging / visual diff
- takeScreenshot: descriptive-name           # writes to .maestro/<run-id>/

# Reset app state mid-flow
- clearState
- launchApp:
    appId: ${MAESTRO_APP_ID}
```

## Adding a new flow — checklist

1. **Identify the testIDs you need** — read the screen/component code, add `testID` props where missing. Follow the `<screen>.<element>` convention.
2. **Create the flow file** at `flows/<feature>/<flow-name>.yaml` with `appId`, `tags`, and the steps.
3. **Reuse subflows** for setup (`launch-app`, `sign-in`, `grant-permissions`). If you find yourself writing the same 3+ steps in two flows, extract a subflow.
4. **Run locally** against an iOS Simulator: `pnpm --filter @dns/mobile test:e2e:flow maestro/flows/<feature>/<flow>.yaml`.
5. **Tag appropriately** — `smoke` if it's a 5-second canary, `regression` otherwise. Always add the feature tag.
6. **Take a screenshot at the assertion point** — gives you visual evidence in CI artifacts when the flow fails.

## Anti-patterns (don't)

| Avoid | Why | Do instead |
|---|---|---|
| `sleep: 3000` between steps | Brittle, slow, hides real timing issues | Rely on `assertVisible` (it auto-waits) or `waitForAnimationToEnd` |
| Tapping by `point: { x: 200, y: 400 }` | Breaks on every screen size / rotation / layout tweak | `tapOn: { id: '...' }` |
| Asserting on translated body copy | Breaks when localization changes | Use `id`; keep text assertions only for stable English-locked strings |
| One mega-flow with 40 steps | Slow feedback, hard to know what failed | Split into focused flows; share setup via subflows |
| Inline credentials in YAML | Leaks to git, can't switch accounts | Pass via env, document required vars in flow's top comment |
| Subflows in `flows/` | Confusing — runner picks them up as standalone tests | Subflows belong in `subflows/`, no `tags:` |
| Skipping `clearState` between unrelated flows | One flow's leftover state breaks the next | Set `MAESTRO_CLEAR_STATE=true` or call `clearState` explicitly |

## Debugging a failing flow

1. **Read the assertion that failed** — Maestro names the step that broke.
2. **Open the screenshot** Maestro auto-captures on failure (`.maestro/<run-id>/screenshot-failure.png`).
3. **Run with `--debug-output`** to capture every step:
   ```bash
   maestro test --debug-output ./test-output flows/<flow>.yaml
   ```
4. **Inspect with Maestro Studio** — interactive REPL against the running simulator:
   ```bash
   maestro studio
   ```
5. **Common failure modes**:
   - Element not found → testID missing or renamed → add/fix testID, re-run.
   - Timeout on assert → animation too slow on cold launch → bump `timeout:` on that assert.
   - Tap doesn't register → element behind safe-area / keyboard → call `hideKeyboard` or scroll first.

## CI integration (future)

When CI is wired:
- PR job: `maestro cloud --include-tags smoke ./apps/mobile/maestro/flows --apk <build>` — fast feedback, blocks merge on red.
- Nightly job: full `regression` suite, parallelized across iOS + Android device matrix via Maestro Cloud.
- Always upload `.maestro/` artifacts so failed runs ship screenshots + video.

## Local install

```bash
brew install maestro          # one-time
maestro --version             # confirm

# Run the smoke set
pnpm --filter @dns/mobile test:e2e:smoke

# Run one flow
pnpm --filter @dns/mobile test:e2e:flow maestro/flows/settings/open-settings.yaml
```

The `maestro/` workspace lives at `apps/mobile/maestro/`. See `apps/mobile/maestro/README.md` for env var details.
