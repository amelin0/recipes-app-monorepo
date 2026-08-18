import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import FemaleIcon from '../../../../assets/icons/onboarding/female.svg';
import MaleIcon from '../../../../assets/icons/onboarding/male.svg';
import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { GenderCard } from './components';
import { useSetupGenderScreen } from './useSetupGenderScreen';

/** Step 3 — biological sex, needed for the calorie formula (RF-mobile-app 855:98346). */
export const SetupGenderScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { gender, selectGender, canProceed, handleNext } = useSetupGenderScreen();

    return (
        <AppScreen>
            <SetupProgress step={3} />

            <View style={styles.content}>
                <SetupHeader
                    title={t('onboarding:setup.gender.title')}
                    subtitle={t('onboarding:setup.gender.subtitle')}
                />

                <View style={styles.options} accessibilityRole="radiogroup">
                    <GenderCard
                        label={t('onboarding:setup.gender.male')}
                        icon={MaleIcon}
                        selected={gender === 'male'}
                        onPress={() => selectGender('male')}
                    />
                    <GenderCard
                        label={t('onboarding:setup.gender.female')}
                        icon={FemaleIcon}
                        selected={gender === 'female'}
                        onPress={() => selectGender('female')}
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
        flexDirection: 'row',
        gap: theme.spacing[3],
    },
}));
