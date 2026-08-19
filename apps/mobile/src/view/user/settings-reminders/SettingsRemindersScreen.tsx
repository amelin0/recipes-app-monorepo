import React from 'react';
import { ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, ReminderCard, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { useSettingsRemindersScreen } from './useSettingsRemindersScreen';

/** Meal and weigh-in reminders (804:24801). */
export const SettingsRemindersScreen = () => {
    const { t } = useAppTranslation(['profile', 'onboarding']);
    const { reminders, weighIn, toggle, toggleExpanded, timeColumnsFor, handleSave } = useSettingsRemindersScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:reminders-screen.title')} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {reminders.map(reminder => (
                    <ReminderCard
                        key={reminder.key}
                        title={t(`onboarding:setup.reminders.meals.${reminder.key}`)}
                        enabled={reminder.enabled}
                        onToggle={value => toggle(reminder.key, value)}
                        value={reminder.time}
                        timeLabel={t('onboarding:setup.reminders.time')}
                        expanded={reminder.expanded}
                        onToggleExpanded={() => toggleExpanded(reminder.key)}
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
            </ScrollView>

            <ScreenActions>
                <AppButton label={t('profile:settings.save')} onPress={handleSave} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
}));
