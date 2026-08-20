import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppText, ScreenActions, SegmentedTabs } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { DaySelectRow } from './components';

import { useCopyPlanScreen } from './useCopyPlanScreen';

/** Копіювати план — pick the days to copy the ration to (435:14472, 435:14675). */
export const CopyPlanScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['meal-plan', 'common']);
    const { activeTab, setActiveTab, days, selected, handleToggle, handleClose, handleApply } = useCopyPlanScreen();

    return (
        <View style={styles.root}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:actions.close')}
                onPress={handleClose}
                style={styles.overlay}
            />

            <View style={styles.sheet}>
                <View style={styles.headerBar}>
                    <View style={styles.headerTexts}>
                        <AppText variant="titleMedium">{t('meal-plan:copy.title')}</AppText>
                        <AppText variant="bodyMediumReg" style={styles.subtitle}>
                            {t('meal-plan:copy.subtitle')}
                        </AppText>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('common:actions.close')}
                        hitSlop={8}
                        onPress={handleClose}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={24} color={theme.colors.elements.primary} />
                    </Pressable>
                </View>

                <View style={styles.tabs}>
                    <SegmentedTabs
                        items={[
                            { key: 'this', label: t('meal-plan:copy.this-week') },
                            { key: 'next', label: t('meal-plan:copy.next-week') },
                        ]}
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        contentSized
                    />
                </View>

                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {days.map(day => (
                        <DaySelectRow
                            key={day.key}
                            name={day.name}
                            date={day.date}
                            selected={selected.includes(day.key)}
                            onPress={() => handleToggle(day.key)}
                        />
                    ))}
                </ScrollView>

                <ScreenActions style={styles.footer}>
                    <AppButton
                        label={t('meal-plan:copy.apply')}
                        disabled={selected.length === 0}
                        onPress={handleApply}
                        fullWidth
                    />
                </ScreenActions>
            </View>
        </View>
    );
};

const styles = StyleSheet.create(theme => ({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.background.overlay,
    },
    // The sheet hangs 58pt below the screen top (435:14472).
    sheet: {
        height: '93%',
        backgroundColor: theme.colors.background.screen,
        borderTopLeftRadius: theme.radius.xl,
        borderTopRightRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadow.sheet,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[3],
        paddingTop: theme.spacing[6],
        paddingBottom: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
    },
    headerTexts: {
        flex: 1,
        gap: theme.spacing[1],
    },
    subtitle: {
        color: theme.colors.semantic.darkGrey,
    },
    closeButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.lightGrey,
    },
    tabs: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
    },
    scrollArea: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        gap: theme.spacing[2],
    },
    footer: {
        backgroundColor: theme.colors.background.screen,
    },
}));
