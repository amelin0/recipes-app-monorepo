import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { OptionRow, SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupUnitsScreen } from './useSetupUnitsScreen';

/** Step 5 — measurement system, which drives every later wheel (RF-mobile-app 855:101238). */
export const SetupUnitsScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { unitSystem, selectUnitSystem, canProceed, handleNext } = useSetupUnitsScreen();

    return (
        <AppScreen>
            <SetupProgress step={5} />

            <View style={styles.content}>
                <SetupHeader title={t('onboarding:setup.units.title')} />

                <View style={styles.options} accessibilityRole="radiogroup">
                    <OptionRow
                        title={t('onboarding:setup.units.metric.title')}
                        description={t('onboarding:setup.units.metric.description')}
                        selected={unitSystem === 'metric'}
                        onPress={() => selectUnitSystem('metric')}
                    />
                    <OptionRow
                        title={t('onboarding:setup.units.imperial.title')}
                        description={t('onboarding:setup.units.imperial.description')}
                        selected={unitSystem === 'imperial'}
                        onPress={() => selectUnitSystem('imperial')}
                    />
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
        gap: theme.spacing[3],
    },
}));
