import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import type { AppTheme } from '@/state/domains/app';
import { toThemeSetting, useUpdateSettings } from '@/state/domains/user';

const THEMES: AppTheme[] = ['Light', 'Dark', 'System'];

/** Translation keys stay kebab-case, like every other key in the locale files. */
export const THEME_KEYS: Record<AppTheme, string> = {
    Light: 'light',
    Dark: 'dark',
    System: 'system',
};

export const useSettingsThemeScreen = () => {
    const { t } = useAppTranslation(['profile', 'common']);
    const appTheme = useStore(state => state.appTheme);
    const setAppTheme = useStore(state => state.setAppTheme);
    const updateSettings = useUpdateSettings();

    const [selected, setSelected] = useState<AppTheme>(appTheme);

    const handleSave = useCallback(() => {
        if (updateSettings.isPending) return;

        updateSettings.mutate(
            { theme: toThemeSetting(selected) },
            {
                onSuccess: () => {
                    setAppTheme(selected);
                    ToastService.success(t('profile:settings.saved'));
                    if (router.canGoBack()) router.back();
                },
                onError: () => {
                    ToastService.error(t('common:states.error'));
                },
            },
        );
    }, [selected, setAppTheme, t, updateSettings]);

    return { themes: THEMES, selected, select: setSelected, isSaving: updateSettings.isPending, handleSave };
};
