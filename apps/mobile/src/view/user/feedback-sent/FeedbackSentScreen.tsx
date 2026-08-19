import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, ScreenActions } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import MascotThanks from '../../../../assets/images/brand/mascot-thanks.svg';

import { useFeedbackSentScreen } from './useFeedbackSentScreen';

const MASCOT_SIZE = 200;

/** Receipt for a submitted feedback report (804:25516). */
export const FeedbackSentScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { handleDone } = useFeedbackSentScreen();

    return (
        <AppScreen>
            <View style={styles.content}>
                <MascotThanks width={MASCOT_SIZE} height={MASCOT_SIZE} />

                <View style={styles.header}>
                    <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                        {t('profile:feedback-sent.title')}
                    </AppText>
                    <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                        {t('profile:feedback-sent.description')}
                    </AppText>
                </View>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:feedback-sent.done')} onPress={handleDone} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        // 804:25517 sits 152 from the frame top — 90 below the 62pt status bar.
        paddingTop: 90,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
