import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotWarning from '../../../../assets/images/brand/mascot-warning.svg';

import { useProblemScreen } from './useProblemScreen';

const MASCOT_SIZE = 200;

/** Something broke and the app has nothing better to show (882:149891). */
export const ProblemScreen = () => {
    const { t } = useAppTranslation(['common']);
    const { handleReport } = useProblemScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <View style={styles.header}>
                    <AppText variant="titleMedium" accessibilityRole="header" style={styles.centered}>
                        {t('common:problem.title')}
                    </AppText>
                    <AppText variant="bodyMediumReg" style={[styles.centered, styles.muted]}>
                        {t('common:problem.description')}
                    </AppText>
                </View>

                <MascotWarning width={MASCOT_SIZE} height={MASCOT_SIZE} />
            </View>

            <ScreenActions>
                <AppButton label={t('common:problem.report')} onPress={handleReport} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[4],
        // 882:149892 sits 152 from the frame top — 90 below the 62pt status bar.
        paddingTop: 90 + theme.spacing[4],
    },
    header: {
        width: '100%',
        gap: theme.spacing[1],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
