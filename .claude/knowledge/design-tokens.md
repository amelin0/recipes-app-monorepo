# Design Tokens

Semantic token system adapted from Figma reference design system, colors tailored for Digital Nutrition Studio wellness aesthetic.

## Token Structure

Tokens organized by **purpose**, not by color name. Same structure used in Tailwind (web) and Unistyles (mobile).

---

## Semantic / Primary (Brand — Olive Green)

Main CTA buttons, active states, progress rings, brand elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary.default` | `#6B8F3C` | Primary buttons, active tab pills, progress rings |
| `primary.active` | `#567230` | Pressed/hover state |
| `primary.onPrimary` | `#FFFFFF` | Text/icon on primary bg |
| `primary.subtle` | `#E8F0D8` | Light sage card backgrounds (nutrition cards) |
| `primary.onSubtle` | `#3D5221` | Text on subtle bg |
| `primary.link` | `#6B8F3C` | Link text |

## Semantic / Secondary (Neutral)

Secondary buttons, outlined elements.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary.default` | `#FFFFFF` | Secondary button bg |
| `secondary.active` | `#F2F2F2` | Pressed state |
| `secondary.onSecondary` | `#595959` | Text on secondary |

## Semantic / Accent (Peach/Warm)

Highlights, badges, warm accents.

| Token | Hex | Usage |
|-------|-----|-------|
| `accent.default` | `#D4956A` | Accent elements, carbs indicator |
| `accent.active` | `#B4754A` | Pressed state |
| `accent.subtle` | `#FFF5F0` | Light peach backgrounds |
| `accent.onAccent` | `#FFFFFF` | Text on accent |

## Semantic / Error

| Token | Hex |
|-------|-----|
| `error.default` | `#D02512` |
| `error.active` | `#A41D0E` |
| `error.subtle` | `#F9BFB9` |
| `error.onError` | `#FFFFFF` |

## Semantic / Success

| Token | Hex |
|-------|-----|
| `success.default` | `#4CAF50` |
| `success.active` | `#388E3C` |
| `success.subtle` | `#E8F5E9` |
| `success.onSuccess` | `#1A1A1A` |

## Semantic / Warning

| Token | Hex |
|-------|-----|
| `warning.default` | `#D58000` |
| `warning.active` | `#B26B00` |
| `warning.subtle` | `#FFEBCC` |
| `warning.onWarning` | `#1A1A1A` |

## Semantic / Info

| Token | Hex |
|-------|-----|
| `info.default` | `#EAECF5` |
| `info.subtle` | `#FCFCFC` |
| `info.onInfo` | `#1A1A1A` |

---

## Color / Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#1A1A1A` | Headings, primary text |
| `text.secondary` | `#595959` | Body text, descriptions |
| `text.tertiary` | `#8C8C8C` | Hints, placeholders |
| `text.error` | `#D02512` | Error messages |
| `text.link` | `#6B8F3C` | Clickable links (brand green) |
| `text.inverse` | `#FCFCFC` | Text on dark backgrounds |

## Color / Background

| Token | Hex | Usage |
|-------|-----|-------|
| `bg.canvas` | `#FFFFFF` | Page background |
| `bg.surface` | `#F8F9FC` | Card/section backgrounds |
| `bg.elevated` | `#FFFFFF` | Modals, floating elements |
| `bg.overlay` | `#19191D` @ 70% | Backdrop overlays |
| `bg.inverse` | `#383838` | Dark backgrounds (tooltips) |

## Color / Border

| Token | Hex |
|-------|-----|
| `border.default` | `#E6E6E6` |
| `border.subtle` | `#F2F2F2` |
| `border.strong` | `#1A1A1A` |
| `border.focus` | `#6B8F3C` |
| `border.error` | `#D02512` |

## Color / Icon

| Token | Hex |
|-------|-----|
| `icon.default` | `#595959` |
| `icon.inverse` | `#E6E6E6` |

## Color / Disabled

| Token | Hex |
|-------|-----|
| `disabled.background` | `#E6E6E6` |
| `disabled.content` | `#8C8C8C` |
| `disabled.border` | `#D9D9D9` |

---

## Nutrition-Specific Tokens

Used for macro indicators, progress rings, chart colors.

| Token | Hex | Usage |
|-------|-----|-------|
| `macro.protein` | `#6B8F3C` | Protein bars/indicators (olive green) |
| `macro.carbs` | `#D4956A` | Carbs bars/indicators (peach) |
| `macro.fats` | `#5B9BD5` | Fats bars/indicators (blue) |
| `macro.calories` | `#8BA651` | Calorie ring/progress (sage green) |

---

## Typography

| Token | Font | Weight | Usage |
|-------|------|--------|-------|
| `font.heading` | Manrope | 500, 600, 700 | H1-H6, card titles |
| `font.body` | Inter | 400, 500, 600 | Body text, labels, buttons |

---

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 8px | Small elements (chips, badges) |
| `radius.md` | 12px | Inputs, small cards |
| `radius.lg` | 16px | Cards, sections |
| `radius.xl` | 24px | Large cards, modals |
| `radius.full` | 9999px | Pills, avatars |

## Shadow

| Token | Value | Usage |
|-------|-------|-------|
| `shadow.sm` | `0 1px 3px rgba(0,0,0,0.07)` | Subtle elevation |
| `shadow.md` | `0 3px 12px rgba(0,0,0,0.08)` | Cards |
| `shadow.lg` | `0 3px 50px rgba(0,0,0,0.07)` | Modals, floating elements |
