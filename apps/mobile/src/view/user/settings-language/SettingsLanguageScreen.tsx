import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, OptionRow, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useSettingsLanguageScreen } from './useSettingsLanguageScreen';

/** Interface language (804:24699). */
export const SettingsLanguageScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { languages, selected, select, handleSave } = useSettingsLanguageScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:language-screen.title')} />

            <View style={styles.content}>
                {languages.map(language => (
                    <OptionRow
                        key={language.code}
                        size="md"
                        title={language.nativeName}
                        description={t(`profile:language-screen.names.${language.code}`)}
                        selected={language.code === selected}
                        onPress={() => select(language.code)}
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
