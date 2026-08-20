import React from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { useKeyboardVisible } from '@/shared/hooks';
import { AppButton, AppCard, AppScreen, AppText, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import LockIcon from '../../../../assets/icons/lock.svg';
import { DangerBadge } from '../account-delete/components';

import { useAccountDeleteConfirmScreen } from './useAccountDeleteConfirmScreen';

/**
 * Last gate before the deletion request — retype the word (804:24954; the
 * keyboard states are 804:24973 and 804:24993).
 */
export const AccountDeleteConfirmScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const isKeyboardVisible = useKeyboardVisible();
    const { value, setValue, confirmWord, isConfirmed, handleDelete } = useAccountDeleteConfirmScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:delete-flow.title')} />

            <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.content}>
                    <DangerBadge>
                        <LockIcon width={32} height={32} color={theme.colors.semantic.white} />
                    </DangerBadge>

                    <AppText variant="titleSmall" accessibilityRole="header" style={styles.centered}>
                        {t('profile:delete-flow.confirm-title')}
                    </AppText>

                    <AppCard style={styles.card}>
                        <AppText variant="bodySmallReg" style={[styles.centered, styles.muted]}>
                            {t('profile:delete-flow.confirm-before')}
                            <AppText variant="bodySmallBold" style={styles.word}>
                                {confirmWord}
                            </AppText>
                            {t('profile:delete-flow.confirm-after')}
                        </AppText>

                        <TextInput
                            value={value}
                            onChangeText={setValue}
                            placeholder={confirmWord}
                            // The 30%-negative ghost of the word to retype (804:24963).
                            placeholderTextColor={`${theme.colors.semantic.negative}4D`}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            accessibilityLabel={t('profile:delete-flow.confirm-a11y', { word: confirmWord })}
                            style={styles.input}
                        />
                    </AppCard>
                </View>

                <ScreenActions style={isKeyboardVisible ? styles.actionsAboveKeyboard : undefined}>
                    <AppButton
                        variant="destructive"
                        label={t('profile:delete-flow.delete')}
                        onPress={handleDelete}
                        disabled={!isConfirmed}
                        fullWidth
                    />
                </ScreenActions>
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
        alignItems: 'center',
        gap: theme.spacing[6],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    word: {
        color: theme.colors.elements.primary,
    },
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[4],
    },
    input: {
        ...theme.typography.bodyMediumBold,
        width: '100%',
        height: 52,
        textAlign: 'center',
        color: theme.colors.semantic.negative,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.forms.lightBorder,
        backgroundColor: theme.colors.background.screen,
    },
    // With the keyboard up the bar sits right above it (804:24973).
    actionsAboveKeyboard: {
        paddingBottom: theme.spacing[4],
    },
}));
