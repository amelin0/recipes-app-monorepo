import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
    AppButton,
    AppCard,
    AppInput,
    AppScreen,
    AppText,
    Avatar,
    ScreenActions,
    TopBar,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import EditIcon from '../../../../assets/icons/edit.svg';

import { useProfileEditScreen } from './useProfileEditScreen';

/** Editing the profile the avatar block links to (804:24616). */
export const ProfileEditScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['profile']);
    const { initials, name, setName, canSave, handleChangePhoto, handleSave } = useProfileEditScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:edit-screen.title')} />

            <View style={styles.content}>
                <View style={styles.avatarBlock}>
                    <Avatar
                        label={initials}
                        size={64}
                        labelVariant="titleSmall"
                        onPress={handleChangePhoto}
                        accessibilityLabel={t('profile:edit-screen.change-photo')}
                        badge={
                            <View style={styles.badge}>
                                <EditIcon width={12} height={12} color={theme.colors.semantic.white} />
                            </View>
                        }
                    />
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={handleChangePhoto}>
                        <AppText variant="bodySmallReg" style={styles.photoLink}>
                            {t('profile:edit-screen.change-photo')}
                        </AppText>
                    </Pressable>
                </View>

                <AppCard style={styles.card}>
                    <AppText variant="bodyMediumBold">{t('profile:edit-screen.personal-title')}</AppText>
                    <AppInput
                        label={t('profile:edit-screen.name-label')}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="name"
                        returnKeyType="done"
                    />
                </AppCard>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:edit-screen.save')} onPress={handleSave} disabled={!canSave} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
    },
    avatarBlock: {
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    badge: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        borderWidth: 2,
        borderColor: theme.colors.semantic.white,
        backgroundColor: theme.colors.branding.accent,
    },
    photoLink: {
        color: theme.colors.branding.accent,
    },
    card: {
        alignItems: 'flex-start',
        gap: theme.spacing[4],
    },
}));
