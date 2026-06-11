# Mobile - UI Components

## Structure

```
src/shared/ui/
├── components/
│   ├── buttons/
│   ├── inputs/
│   ├── headers/
│   ├── common/
│   ├── layouts/
│   ├── modals/
│   ├── bottom-sheets/
│   ├── toasts/
│   ├── icon/
│   └── navigation/
├── widgets/
└── constants/
```

## Current Status

Folder structure created with subdirectories. No components implemented yet — all will be built as features are developed.

## Planned Component Categories

### Buttons (`components/buttons/`)

- `Button`, `IconButton`

### Inputs (`components/inputs/`)

- `Input`, `SearchInput`

### Common (`components/common/`)

- `Avatar`, `Badge`, `Skeleton`, `EmptyState`, `Card`

### Headers (`components/headers/`)

- `Header`, `StepHeader`

### Layouts (`components/layouts/`)

- `Screen`, `Section`

### Modals / Bottom Sheets

- `Modal`, `BottomSheet`, `ConfirmDialog`

### Icon (`components/icon/`)

- Wrapper around `@expo/vector-icons`

### Widgets (`widgets/`)

- Complex composed components with internal state
- `ExercisePicker`, `TimerDisplay`, `WorkoutBuilder`

## Usage

```typescript
// Components live under shared/ui — import path TBD based on barrel export
import { Button } from '@/shared/ui/components/buttons';
```
