import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, OptionRow, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { ThemeSwatch } from './components';
import { THEME_KEYS, useSettingsThemeScreen } from './useSettingsThemeScreen';

/** Light / dark / system appearance (804:24773). */
export const SettingsThemeScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { themes, selected, select, handleSave } = useSettingsThemeScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:theme-screen.title')} />

            <View style={styles.content}>
                {themes.map(theme => (
                    <OptionRow
                        key={theme}
                        size="md"
                        leading={<ThemeSwatch mode={theme} />}
                        title={t(`profile:theme-screen.options.${THEME_KEYS[theme]}.title`)}
                        description={t(`profile:theme-screen.options.${THEME_KEYS[theme]}.description`)}
                        selected={theme === selected}
                        onPress={() => select(theme)}
                    />
                ))}
            </View>

            <ScreenActions>
                <AppButton label={t('profile:settings.save')} onPress={handleSave} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
}));
