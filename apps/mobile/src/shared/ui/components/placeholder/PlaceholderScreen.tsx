import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { useAppTranslation } from '@/shared/utils/translations';

import { AppScreen } from '../layouts';
import { AppText } from '../texts';

export interface PlaceholderScreenProps {
    /** i18n key for the screen title (e.g. 'common:tabs.home'). */
    titleKey: string;
}

/**
 * Temporary route stub. Real screens live in `src/view/<domain>/<screen>/`
 * and are added one by one from Figma designs — replace the stub import
 * in the route file when the screen ships.
 */
export const PlaceholderScreen = ({ titleKey }: PlaceholderScreenProps) => {
    const { t } = useAppTranslation();

    return (
        <AppScreen>
            <View style={styles.content}>
                <AppText variant="titleLarge">{t(titleKey)}</AppText>
                <AppText color="tertiary">{t('common:placeholder.coming-soon')}</AppText>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        gap: theme.spacing[2],
    },
}));
