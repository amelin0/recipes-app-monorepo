import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { useKeyboardVisible } from '@/shared/hooks';
import { AppInput, AppScreen } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SetupFooter, SetupHeader, SetupProgress } from '../components';

import { useSetupNameScreen } from './useSetupNameScreen';

/**
 * Step 1 of the profile-setup questionnaire — RF-mobile-app 66:2333 (idle) and
 * 852:96676 (typing). With the keyboard up the footer collapses from
 * "back + CTA" to a single full-width CTA sitting above the keys.
 */
export const SetupNameScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const isKeyboardVisible = useKeyboardVisible();
    const { name, setName, canProceed, handleNext } = useSetupNameScreen();

    return (
        <AppScreen>
            <SetupProgress step={1} />

            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.content}>
                    <SetupHeader
                        title={t('onboarding:setup.name.title')}
                        subtitle={t('onboarding:setup.name.subtitle')}
                    />

                    <AppInput
                        placeholder={t('onboarding:setup.name.placeholder')}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="given-name"
                        autoCorrect={false}
                        returnKeyType="done"
                    />
                </View>

                <SetupFooter
                    canProceed={canProceed}
                    onNext={handleNext}
                    fullWidth={isKeyboardVisible}
                    aboveKeyboard={isKeyboardVisible}
                />
            </KeyboardAvoidingView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        // Puts the header on the frame's y=164 once the progress row above is
        // accounted for.
        paddingTop: 72,
        gap: theme.spacing[6],
    },
}));
