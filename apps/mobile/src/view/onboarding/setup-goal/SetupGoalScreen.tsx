import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { OptionRow, SetupFooter, SetupHeader, SetupProgress } from '../components';
import { GOAL_KEYS } from '../onboarding.constants';

import { useSetupGoalScreen } from './useSetupGoalScreen';

/** Step 12 — what the user is here for (RF-mobile-app 864:118671). */
export const SetupGoalScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { goal, selectGoal, canProceed, handleNext } = useSetupGoalScreen();

    return (
        <AppScreen>
            <SetupProgress step={12} />

            <View style={styles.content}>
                <SetupHeader title={t('onboarding:setup.goal.title')} subtitle={t('onboarding:setup.goal.subtitle')} />

                <View style={styles.options} accessibilityRole="radiogroup">
                    {GOAL_KEYS.map(key => (
                        <OptionRow
                            key={key}
                            size="lg"
                            title={t(`onboarding:setup.goal.options.${key}.title`)}
                            description={t(`onboarding:setup.goal.options.${key}.description`)}
                            selected={goal === key}
                            onPress={() => selectGoal(key)}
                        />
                    ))}
                </View>
            </View>

            <SetupFooter canProceed={canProceed} onNext={handleNext} />
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: 72,
        gap: theme.spacing[6],
    },
    options: {
        gap: theme.spacing[2],
    },
}));
