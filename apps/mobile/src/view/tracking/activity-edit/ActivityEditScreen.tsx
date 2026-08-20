import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, LevelStepper, NumberedLegend } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';

import { useActivityEditScreen } from './useActivityEditScreen';

/** Sheet for the weekly activity level, opened from goal setup (984:58347). */
export const ActivityEditScreen = () => {
    const { t } = useAppTranslation(['onboarding', 'common', 'tracking']);
    const { theme } = useUnistyles();
    const { level, setLevel, min, max, labels, canSave, handleClose, handleSave } = useActivityEditScreen();

    return (
        <View style={styles.sheet}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="titleMedium">{t('onboarding:setup.activity.title')}</AppText>
                    <AppText variant="bodyMediumReg" style={styles.muted}>
                        {t('onboarding:setup.activity.subtitle')}
                    </AppText>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common:actions.close')}
                    hitSlop={8}
                    onPress={handleClose}
                    style={styles.closeButton}
                >
                    <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            <View style={styles.content}>
                <LevelStepper
                    value={level}
                    min={min}
                    max={max}
                    onChange={setLevel}
                    decrementLabel={t('onboarding:setup.activity.decrement')}
                    incrementLabel={t('onboarding:setup.activity.increment')}
                />

                <NumberedLegend labels={labels} />
            </View>

            <View style={styles.actions}>
                <AppButton
                    size="md"
                    label={t('tracking:goal-setup.unsaved.save')}
                    onPress={handleSave}
                    disabled={!canSave}
                    fullWidth
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        backgroundColor: theme.colors.background.screen,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[4],
    },
    headerText: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing[1],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    content: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    actions: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: theme.spacing[10],
    },
}));
