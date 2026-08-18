import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotChef from '../../../../assets/images/brand/mascot-chef.svg';
import { HighlightedTitle } from '../components';
import { SETUP_MASCOT_SIZE } from '../onboarding.constants';

import { useSetupIntroScreen } from './useSetupIntroScreen';

/** First screen of the post-registration profile setup — RF-mobile-app 852:83113. */
export const SetupIntroScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { handleStart } = useSetupIntroScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <View style={styles.hero}>
                    <MascotChef width={SETUP_MASCOT_SIZE} height={SETUP_MASCOT_SIZE} />

                    <HighlightedTitle
                        title={t('onboarding:setup.intro.title')}
                        highlight="accent"
                        variant="displayMedium"
                        accentVariant="displayMedium"
                    />

                    <AppText variant="bodyLargeReg" style={styles.muted}>
                        {t('onboarding:setup.intro.subtitle')}
                    </AppText>
                </View>

                <View style={styles.actions}>
                    <AppButton
                        label={t('onboarding:setup.intro.start')}
                        onPress={handleStart}
                        fullWidth
                        style={styles.start}
                    />
                    <AppText variant="bodyLargeReg" style={styles.muted}>
                        {t('onboarding:setup.intro.duration')}
                    </AppText>
                </View>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        // Design hangs the block 114 below the safe area (frame y=164 on a
        // 375×812 mock whose real top inset is 50).
        paddingTop: 114,
        gap: theme.spacing[10],
    },
    hero: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    actions: {
        width: '100%',
        gap: theme.spacing[3],
    },
    // The single CTA is taller than the RFDS `lg` preset on this screen.
    start: {
        minHeight: 56,
    },
    muted: {
        width: '100%',
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
}));
