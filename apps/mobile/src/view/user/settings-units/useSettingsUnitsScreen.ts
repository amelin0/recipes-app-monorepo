import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import { UNIT_QUANTITIES } from '@/state/domains/app';
import type { UnitPreference, UnitPreferences, UnitQuantity } from '@/state/domains/app';
import { toSettingsUnitsPayload, useUpdateSettings } from '@/state/domains/user';

/** Translation keys stay kebab-case, like every other key in the locale files. */
export const QUANTITY_KEYS: Record<UnitQuantity, string> = {
    bodyMass: 'body-mass',
    foodWeight: 'food-weight',
    length: 'length',
    water: 'water',
};

export const useSettingsUnitsScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const saved = useStore(state => state.units);
    const setUnitPreference = useStore(state => state.setUnitPreference);
    const setAnswer = useStore(state => state.setProfileSetupAnswerAction);
    const updateSettings = useUpdateSettings();

    const [units, setUnits] = useState<UnitPreferences>(saved);

    const select = useCallback((quantity: UnitQuantity, preference: UnitPreference) => {
        setUnits(prev => ({ ...prev, [quantity]: preference }));
    }, []);

    const handleSave = useCallback(() => {
        if (updateSettings.isPending) return;

        const payload = toSettingsUnitsPayload(units, saved);

        const applyLocally = () => {
            UNIT_QUANTITIES.forEach(quantity => setUnitPreference(quantity, units[quantity]));
            // The questionnaire only knows one system; body mass is the one it
            // asks about, so it stays in step with what the wheels convert.
            setAnswer('unitSystem', units.bodyMass);
        };

        // Нічого не змінили — кнопка все одно має закривати екран, а порожнє
        // тіло сервер відхилив би 422 «Provide at least one setting».
        if (Object.keys(payload).length === 0) {
            if (router.canGoBack()) router.back();
            return;
        }

        updateSettings.mutate(payload, {
            onSuccess: () => {
                applyLocally();
                ToastService.success(t('profile:settings.saved'));
                if (router.canGoBack()) router.back();
            },
            onError: () => {
                ToastService.error(t('common:states.error'));
            },
        });
    }, [saved, setAnswer, setUnitPreference, t, units, updateSettings]);

    return {
        quantities: UNIT_QUANTITIES,
        units,
        select,
        isSaving: updateSettings.isPending,
        handleSave,
    };
};
