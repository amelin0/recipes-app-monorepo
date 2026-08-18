import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, WheelPicker } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupWeightScreen } from './useSetupWeightScreen';

/** Step 6 — body weight on a single-column wheel (RF-mobile-app 855:101071). */
export const SetupWeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { columns, handleNext } = useSetupWeightScreen();

    return (
        <AppScreen>
            <SetupProgress step={6} />

            <View style={styles.content}>
                <SetupHeader
                    title={t('onboarding:setup.weight.title')}
                    subtitle={t('onboarding:setup.weight.subtitle')}
                />

                <WheelPicker columns={columns} />
            </View>

            <SetupFooter canProceed onNext={handleNext} />
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
}));
