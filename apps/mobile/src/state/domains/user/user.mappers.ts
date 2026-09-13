import type { AppTheme, UnitPreference, UnitPreferences, UnitQuantity } from '@/state/domains/app';
import type { AppThemeSetting, UnitSystem, UpdateSettingsPayload, UserSettings } from '@/data';

/**
 * The server stores the same four unit switches the app does, under different
 * names and casings. Both directions live here so a rename on either side
 * breaks in one file rather than in five screens.
 */
const QUANTITY_TO_FIELD: Record<
    UnitQuantity,
    keyof Pick<UserSettings, 'massUnit' | 'productWeightUnit' | 'lengthUnit' | 'waterUnit'>
> = {
    bodyMass: 'massUnit',
    foodWeight: 'productWeightUnit',
    length: 'lengthUnit',
    water: 'waterUnit',
};

const toUnitPreference = (value: UnitSystem): UnitPreference => (value === 'IMPERIAL' ? 'imperial' : 'metric');

const toUnitSystem = (value: UnitPreference): UnitSystem => (value === 'imperial' ? 'IMPERIAL' : 'METRIC');

export const toUnitPreferences = (settings: UserSettings): UnitPreferences => ({
    bodyMass: toUnitPreference(settings.massUnit),
    foodWeight: toUnitPreference(settings.productWeightUnit),
    length: toUnitPreference(settings.lengthUnit),
    water: toUnitPreference(settings.waterUnit),
});

/** Only the quantities that actually changed — the endpoint takes a partial body. */
export const toSettingsUnitsPayload = (next: UnitPreferences, previous?: UnitPreferences): UpdateSettingsPayload => {
    const payload: UpdateSettingsPayload = {};

    (Object.keys(QUANTITY_TO_FIELD) as UnitQuantity[]).forEach(quantity => {
        if (previous && previous[quantity] === next[quantity]) return;
        payload[QUANTITY_TO_FIELD[quantity]] = toUnitSystem(next[quantity]);
    });

    return payload;
};

export const toAppTheme = (theme: AppThemeSetting): AppTheme =>
    theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

export const toThemeSetting = (theme: AppTheme): AppThemeSetting =>
    theme === 'Dark' ? 'dark' : theme === 'Light' ? 'light' : 'system';
