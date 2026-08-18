import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, WheelPicker } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupHeightScreen } from './useSetupHeightScreen';

/** Step 7 — body height on a single-column wheel (RF-mobile-app 855:109474). */
export const SetupHeightScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { columns, handleNext } = useSetupHeightScreen();

    return (
        <AppScreen>
            <SetupProgress step={7} />

            <View style={styles.content}>
                <SetupHeader
                    title={t('onboarding:setup.height.title')}
                    subtitle={t('onboarding:setup.height.subtitle')}
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
