import { useCallback, useState } from 'react';

import { router } from 'expo-router';

import { ToastService } from '@/shared/services';
import { useAppTranslation } from '@/shared/utils/translations';
import { useStore } from '@/state';
import type { AppTheme } from '@/state/domains/app';

const THEMES: AppTheme[] = ['Light', 'Dark', 'System'];

/** Translation keys stay kebab-case, like every other key in the locale files. */
export const THEME_KEYS: Record<AppTheme, string> = {
    Light: 'light',
    Dark: 'dark',
    System: 'system',
};

export const useSettingsThemeScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const appTheme = useStore(state => state.appTheme);
    const setAppTheme = useStore(state => state.setAppTheme);

    const [selected, setSelected] = useState<AppTheme>(appTheme);

    const handleSave = useCallback(() => {
        setAppTheme(selected);
        ToastService.success(t('profile:settings.saved'));
        if (router.canGoBack()) {
            router.back();
        }
    }, [setAppTheme, selected, t]);

    return { themes: THEMES, selected, select: setSelected, handleSave };
};
