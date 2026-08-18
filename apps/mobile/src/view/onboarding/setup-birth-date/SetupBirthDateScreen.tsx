import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, AppText, WheelPicker } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupBirthDateScreen } from './useSetupBirthDateScreen';

/** Step 4 — birth date on a scroll wheel (RF-mobile-app 66:2356). */
export const SetupBirthDateScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { columns, canProceed, handleNext } = useSetupBirthDateScreen();

    return (
        <AppScreen>
            <SetupProgress step={4} />

            <View style={styles.content}>
                <SetupHeader
                    title={t('onboarding:setup.birth-date.title')}
                    subtitle={t('onboarding:setup.birth-date.subtitle')}
                />

                <WheelPicker columns={columns} />

                <AppText variant="bodyMediumReg" style={styles.hint}>
                    {t('onboarding:setup.birth-date.hint')}
                </AppText>
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
    hint: {
        width: '100%',
        textAlign: 'center',
        color: theme.colors.semantic.darkGrey,
    },
}));
