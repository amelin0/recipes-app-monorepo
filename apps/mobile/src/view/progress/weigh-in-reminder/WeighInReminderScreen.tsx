import React from 'react';
import { Pressable, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppSwitch, AppText, WheelPicker } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';

import { useWeighInReminderScreen } from './useWeighInReminderScreen';

/** When to be reminded to step on the scales (673:43333). */
export const WeighInReminderScreen = () => {
    const { t } = useAppTranslation(['progress', 'common']);
    const { theme } = useUnistyles();
    const { enabled, setEnabled, cadenceWeeks, nextDate, columns, handleClose, handleSave } =
        useWeighInReminderScreen();

    const cadenceLabel = t('progress:reminder.cadence', { count: cadenceWeeks });

    return (
        <View style={styles.sheet}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <AppText variant="titleMedium">{t('progress:reminder.title')}</AppText>
                    <AppText variant="bodyMediumReg" style={styles.muted}>
                        {t('progress:reminder.subtitle')}
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

            <View style={styles.body}>
                <View style={styles.card}>
                    <View style={styles.labels}>
                        <AppText variant="bodyLargeBold">{cadenceLabel}</AppText>
                        <AppText variant="bodyMediumReg" style={styles.muted}>
                            {t('progress:reminder.next', { date: nextDate })}
                        </AppText>
                    </View>
                    <AppSwitch
                        value={enabled}
                        onValueChange={setEnabled}
                        tone="positive"
                        accessibilityLabel={cadenceLabel}
                    />
                </View>

                <WheelPicker columns={columns} separator=":" />

                <AppButton fullWidth size="md" label={t('progress:reminder.save')} onPress={handleSave} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    sheet: {
        flex: 1,
        backgroundColor: theme.colors.semantic.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[6],
    },
    headerText: {
        flex: 1,
        gap: theme.spacing[1],
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    body: {
        gap: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[6],
    },
    card: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        padding: theme.spacing[3],
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    labels: {
        flex: 1,
        minWidth: 0,
        gap: theme.spacing[1],
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
}));
