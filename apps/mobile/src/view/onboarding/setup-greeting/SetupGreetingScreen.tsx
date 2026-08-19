import React from 'react';
import { Image, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupProgress } from '../components';
import { SETUP_MASCOT_SIZE } from '../onboarding.constants';

import { useSetupGreetingScreen } from './useSetupGreetingScreen';

/** Step 2 — the mascot greets the user by name (RF-mobile-app 852:96816). */
export const SetupGreetingScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { name, handleNext } = useSetupGreetingScreen();

    return (
        <AppScreen>
            <SetupProgress step={2} />

            <View style={styles.content}>
                <Image
                    source={require('../../../../assets/images/brand/mascot-greeting.png')}
                    style={styles.mascot}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                />

                <AppText variant="titleMedium" accessibilityRole="header" style={styles.centered}>
                    {t('onboarding:setup.greeting.title', { name })}
                </AppText>
                <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                    {t('onboarding:setup.greeting.subtitle')}
                </AppText>
            </View>

            <SetupFooter canProceed onNext={handleNext} fullWidth />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        // Same 114-below-the-safe-area offset the rest of the flow uses.
        paddingTop: 72,
        gap: theme.spacing[2],
    },
    mascot: {
        width: SETUP_MASCOT_SIZE,
        height: SETUP_MASCOT_SIZE,
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
