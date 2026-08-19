import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, ReminderCard } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import CloseIcon from '../../../../assets/icons/close.svg';
import { SetupHeader } from '../components';

import { useSetupRemindersScreen } from './useSetupRemindersScreen';

/** Reminder schedule set up right after the permission ask (882:141275). */
export const SetupRemindersScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const { reminders, weighIn, toggle, toggleExpanded, timeColumnsFor, handleClose, handleSave } =
        useSetupRemindersScreen();

    return (
        <AppScreen>
            <View style={styles.topBar}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('onboarding:setup.reminders.close')}
                    hitSlop={8}
                    onPress={handleClose}
                    style={styles.closeButton}
                >
                    <CloseIcon width={20} height={20} color={theme.colors.elements.primary} />
                </Pressable>
            </View>

            <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SetupHeader
                    title={t('onboarding:setup.reminders.title')}
                    subtitle={t('onboarding:setup.reminders.subtitle')}
                />

                <View style={styles.list}>
                    {reminders.map(reminder => (
                        <ReminderCard
                            key={reminder.key}
                            title={t(`onboarding:setup.reminders.meals.${reminder.key}`)}
                            enabled={reminder.enabled}
                            onToggle={value => toggle(reminder.key, value)}
                            value={reminder.time}
                            expanded={reminder.expanded}
                            onToggleExpanded={() => toggleExpanded(reminder.key)}
                            timeLabel={t('onboarding:setup.reminders.time')}
                            timeColumns={timeColumnsFor(reminder.key)}
                        />
                    ))}

                    <ReminderCard
                        title={t('onboarding:setup.reminders.weigh-in.title')}
                        caption={t('onboarding:setup.reminders.weigh-in.caption', { date: weighIn.nextDate })}
                        enabled={weighIn.enabled}
                        onToggle={value => toggle('weigh-in', value)}
                        value={t('onboarding:setup.reminders.weigh-in.cadence')}
                        timeLabel={t('onboarding:setup.reminders.time')}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <AppButton label={t('onboarding:setup.reminders.save')} onPress={handleSave} fullWidth />
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    topBar: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
    },
    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.white30,
    },
    content: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        gap: theme.spacing[4],
    },
    list: {
        gap: theme.spacing[3],
    },
    footer: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
    },
}));
