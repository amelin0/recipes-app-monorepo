---
name: widgets
description: Patterns for widget components — composed UI elements combining multiple simple components, often including BottomSheet modals or complex interaction patterns.
---

# Widgets Skill

## Purpose

Catalog and patterns for widget components — composed UI elements that combine multiple simple components, have internal logic, and are shared across screens.

---

## Widget vs Component

| Aspect | Component (`components/`) | Widget (`widgets/`) |
|--------|--------------------------|---------------------|
| Complexity | Atomic, single-purpose | Composed from multiple components |
| State | Stateless or minimal | Has internal UI state (search, open/close, selection) |
| Logic | No business logic | Generic UI logic (filtering, selection, gestures) |
| BottomSheet | Never | Often includes BottomSheetModal |
| Dependencies | None or minimal | Uses shared components, `BaseBottomSheet`, `AppIcon`, etc. |
| Structure | Single file | **Always a folder** with internal components |

---

## Widget Structure (mandatory)

Every widget MUST live in its own folder, even if it starts as a single file. Widgets often grow to include internal components, helpers, or types.

```
src/shared/ui/widgets/
├── WidgetName/
│   ├── WidgetName.tsx          # Main widget component
│   ├── components/             # Internal sub-components (optional)
│   │   ├── InternalPart.tsx
│   │   └── index.ts
│   ├── widget-name.types.ts    # Types (optional, if complex)
│   ├── widget-name.helpers.ts  # Helpers (optional)
│   └── index.ts                # Barrel export
├── AnotherWidget/
│   └── ...
└── index.ts                    # Root barrel — exports all widgets
```

### Rules:
1. **Always a folder** — never a single `.tsx` file directly in `widgets/`
2. **Barrel export** — every widget folder has `index.ts`
3. **Internal components** — if the widget has sub-parts, put them in `components/`
4. **No domain logic** — widgets are generic UI, domain logic stays in screen hooks
5. **Shared only** — widgets are used across 2+ screens, or are clearly reusable

---

## Current Widgets

### DatePicker (`widgets/DatePicker/`)

Date selection with three separate selectors (day, month, year). Month selector uses a BottomSheetModal with radio selection.

**Files:**
- `DatePicker.tsx` — Main component with day/month/year dropdowns
- `MonthBottomSheet.tsx` — Month selector using `BaseBottomSheet` + `BottomSheetFlatList`
- `index.ts` — Barrel export

**Usage:**
```typescript
import { DatePicker, DateValue } from '@/shared/ui/widgets';

<DatePicker
  value={dateValue}
  onChange={setDateValue}
  label="Date of birth"
  error={errors.birthday?.message}
/>
```

---

### PhoneInput (`widgets/PhoneInput/`)

Phone number input with country code picker. Opens a BottomSheetModal with searchable country list.

**Files:**
- `PhoneInput.tsx` — Input + country code trigger + BottomSheet
- `phone-countries.ts` — Country data (code, name, dialCode, flag)
- `index.ts` — Barrel export

**Exports:** `PhoneInput`, `PHONE_COUNTRIES`, `PhoneCountry` (type)

**Usage:**
```typescript
import { PhoneInput, PHONE_COUNTRIES, type PhoneCountry } from '@/shared/ui/widgets';

<PhoneInput
  value={phone}
  onChangeText={setPhone}
  selectedCountry={selectedCountry}
  onCountrySelect={setSelectedCountry}
  label="Phone number"
  error={errors.phone?.message}
/>
```

---

### SelectCountryDropdown (`widgets/SelectCountryDropdown/`)

Country selector dropdown with search and flag icons. Uses `BaseBottomSheet` and `SelectButton`.

---

### DocumentTypeDropdown (`widgets/DocumentTypeDropdown/`)

Document type selector dropdown for KYC document upload.

---

### SelectCurrencyBottomSheet (`widgets/SelectCurrencyBottomSheet/`)

Currency selector with search, wallet list, and available currencies. Uses `BaseBottomSheet`, `FlagIcon`, `AppIcon`.

---

### SwipableStackList (`widgets/SwipableStackList/`)

Swipable stacked card list with gesture-driven interactions. Used for wallet slider on home screen.

**Exports:** `SwipableStackList`, `SwipableStackListRef` (type)

---

### TidioOverlay (`widgets/TidioOverlay/`)

Floating Tidio chat button overlay with WebView integration.

---

## Creating a New Widget

1. **Create a folder** — `widgets/WidgetName/`
2. **Main component** — `WidgetName.tsx` inside the folder
3. **Barrel export** — `index.ts` re-exports the component and types
4. **Internal components** — if the widget has sub-parts, create `components/` inside
5. **Root export** — add to `widgets/index.ts`
6. Use `BaseBottomSheet` from `components/bottom-sheets` for modal patterns
7. Use `BottomSheetFlatList` and `BottomSheetTextInput` from `@gorhom/bottom-sheet` inside sheets
8. Keep logic generic (UI filtering, selection) — no domain-specific logic
