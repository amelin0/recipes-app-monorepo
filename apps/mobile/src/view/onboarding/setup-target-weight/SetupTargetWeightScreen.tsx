import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, WheelPicker } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupTargetWeightScreen } from './useSetupTargetWeightScreen';

/** Step 13 — desired weight (RF-mobile-app 1000:78742). */
export const SetupTargetWeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { columns, handleNext } = useSetupTargetWeightScreen();

    return (
        <AppScreen>
            <SetupProgress step={13} />

            <View style={styles.content}>
                <SetupHeader
                    title={t('onboarding:setup.target-weight.title')}
                    subtitle={t('onboarding:setup.target-weight.subtitle')}
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
