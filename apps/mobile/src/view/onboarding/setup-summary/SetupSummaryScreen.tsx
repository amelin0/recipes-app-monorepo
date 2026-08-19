import React from 'react';
import { Image, ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { SETUP_MASCOT_SIZE } from '../onboarding.constants';

import { DailyGoalRow, MacroChips } from './components';
import { useSetupSummaryScreen } from './useSetupSummaryScreen';

/** Closing screen of the questionnaire — the plan it produced (864:121025). */
export const SetupSummaryScreen = () => {
    const { t } = useAppTranslation(['onboarding']);
    const { theme } = useUnistyles();
    const { name, goalTitle, targetWeight, calories, macros, water, steps, handleEdit, handleStart } =
        useSetupSummaryScreen();

    return (
        <AppScreen>
            <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Image
                        source={require('../../../../assets/images/brand/mascot-like.png')}
                        style={styles.mascot}
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                    />
                    <View style={styles.header}>
                        <AppText variant="titleLarge" accessibilityRole="header" style={styles.centered}>
                            {t('onboarding:setup.summary.title', { name })}
                        </AppText>
                        <AppText variant="bodyLargeReg" style={[styles.centered, styles.muted]}>
                            {t('onboarding:setup.summary.subtitle')}
                        </AppText>
                    </View>
                </View>

                <View style={styles.goalCard}>
                    <AppText style={styles.goalEmoji}>🎯</AppText>
                    <View style={styles.goalLabels}>
                        <AppText variant="bodySmallReg">{t('onboarding:setup.summary.goal-label')}</AppText>
                        <AppText variant="bodyLargeBold" style={styles.ocean}>
                            {goalTitle}
                        </AppText>
                    </View>
                    <AppText variant="titleLarge" style={styles.ocean}>
                        {targetWeight}
                    </AppText>
                </View>

                <View style={styles.dailyCard}>
                    <AppText variant="titleSmall">{t('onboarding:setup.summary.daily-title')}</AppText>

                    <DailyGoalRow
                        emoji="🔥"
                        badgeColor={theme.colors.semantic.lightGrey}
                        label={t('onboarding:setup.summary.macros-label')}
                        value={calories}
                    >
                        <MacroChips chips={macros} />
                    </DailyGoalRow>

                    <DailyGoalRow
                        emoji="💧"
                        badgeColor={theme.colors.semantic.lightOcean}
                        label={t('onboarding:setup.summary.water-label')}
                        value={water}
                    />

                    <DailyGoalRow
                        emoji="👟"
                        badgeColor={theme.colors.semantic.lightOrange}
                        label={t('onboarding:setup.summary.steps-label')}
                        value={steps}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <AppButton variant="secondary" label={t('onboarding:setup.summary.edit')} onPress={handleEdit} />
                <AppButton label={t('onboarding:setup.summary.start')} onPress={handleStart} style={styles.start} />
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    fill: {
        flex: 1,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        gap: theme.spacing[6],
    },
    hero: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    mascot: {
        width: SETUP_MASCOT_SIZE,
        height: SETUP_MASCOT_SIZE,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    centered: {
        width: '100%',
        textAlign: 'center',
    },
    muted: {
        color: theme.colors.semantic.darkGrey,
    },
    goalCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.semantic.ocean,
        backgroundColor: theme.colors.semantic.lightOcean,
        ...theme.shadow.block,
    },
    goalEmoji: {
        fontSize: 32,
        lineHeight: 45,
    },
    goalLabels: {
        flex: 1,
        justifyContent: 'center',
    },
    ocean: {
        color: theme.colors.semantic.ocean,
    },
    dailyCard: {
        width: '100%',
        gap: theme.spacing[2],
        padding: theme.spacing[4],
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        // App-file literal: the design outlines this card in a light orange that
        // has no RFDS variable behind it.
        borderColor: '#FFBEA0',
        backgroundColor: theme.colors.semantic.white,
        ...theme.shadow.block,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[10],
    },
    start: {
        flex: 1,
    },
}));
