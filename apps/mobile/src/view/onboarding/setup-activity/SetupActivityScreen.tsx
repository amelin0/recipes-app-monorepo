import React from 'react';
import { ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, LevelStepper, NumberedLegend } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';
import { ACTIVITY_LEVEL_MAX } from '../onboarding.constants';

import { useSetupActivityScreen } from './useSetupActivityScreen';

/** Step 11 — weekly activity level, 1–8 (RF-mobile-app 984:58062). */
export const SetupActivityScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { level, setLevel, labels, canProceed, handleNext } = useSetupActivityScreen();

    return (
        <AppScreen>
            <SetupProgress step={11} />

            <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SetupHeader
                    title={t('onboarding:setup.activity.title')}
                    subtitle={t('onboarding:setup.activity.subtitle')}
                />

                <LevelStepper
                    value={level}
                    // Zero is the untouched state the design opens on; the real
                    // scale starts at 1.
                    min={0}
                    max={ACTIVITY_LEVEL_MAX}
                    onChange={setLevel}
                    decrementLabel={t('onboarding:setup.activity.decrement')}
                    incrementLabel={t('onboarding:setup.activity.increment')}
                />

                <NumberedLegend labels={labels} />
            </ScrollView>

            <SetupFooter canProceed={canProceed} onNext={handleNext} />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    // The eight-row legend overflows a 667pt screen, so this step scrolls where
    // the rest of the questionnaire does not.
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: 72,
        gap: theme.spacing[6],
        paddingBottom: theme.spacing[6],
    },
}));
