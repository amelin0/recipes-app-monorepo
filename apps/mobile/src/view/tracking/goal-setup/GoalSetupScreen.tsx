import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppScreen, AppText, CircleBackButton, SectionHeader, SelectCard } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { CalorieStepper, MacroBalanceCard, NutrientSliderCard, TipCard, UserParamsCard } from './components';
import { useGoalSetupScreen } from './useGoalSetupScreen';

export const GoalSetupScreen = () => {
    const { t } = useAppTranslation(['tracking']);
    const {
        params,
        goals,
        selectedGoal,
        calories,
        balanceSegments,
        nutrients,
        handleSelectGoal,
        handleDecreaseCalories,
        handleIncreaseCalories,
        handleNutrientChange,
        handleChangeParams,
        handleSave,
    } = useGoalSetupScreen();

    return (
        <AppScreen>
            <View style={styles.headerBar}>
                <CircleBackButton />
                <AppButton
                    variant="secondary"
                    size="md"
                    label={t('common:actions.save')}
                    onPress={handleSave}
                    style={styles.saveButton}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <AppText variant="titleMedium">{t('tracking:goal-setup.title')}</AppText>

                <View style={styles.section}>
                    <SectionHeader title={t('tracking:goal-setup.params-title')} />
                    <UserParamsCard
                        weight={params.weight}
                        height={params.height}
                        activity={params.activity}
                        onChangePress={handleChangeParams}
                    />
                </View>

                <View style={styles.section}>
                    <SectionHeader title={t('tracking:goal-setup.quick-title')} />
                    <View style={styles.goals}>
                        {goals.map(goal => (
                            <SelectCard
                                key={goal.key}
                                emoji={goal.emoji}
                                title={t(`tracking:goal-setup.goals.${goal.key}`)}
                                subtitle={t('tracking:goal-setup.kcal-value', { value: goal.calories })}
                                selected={selectedGoal === goal.key}
                                onPress={() => handleSelectGoal(goal.key)}
                            />
                        ))}
                    </View>
                </View>

                <CalorieStepper
                    calories={calories}
                    onDecrease={handleDecreaseCalories}
                    onIncrease={handleIncreaseCalories}
                />

                <MacroBalanceCard segments={balanceSegments} />

                {nutrients.map(nutrient => (
                    <NutrientSliderCard
                        key={nutrient.key}
                        emoji={nutrient.emoji}
                        title={t(`tracking:goal-setup.nutrients.${nutrient.key}`)}
                        value={nutrient.value}
                        min={nutrient.min}
                        max={nutrient.max}
                        color={nutrient.color}
                        unit={t(nutrient.unit === 'ml' ? 'tracking:goal-setup.unit-ml' : 'tracking:goal-setup.unit-g')}
                        step={nutrient.step}
                        onChange={value => handleNutrientChange(nutrient.key, value)}
                    />
                ))}

                <TipCard label={t('tracking:goal-setup.tip-label')} text={t('tracking:goal-setup.tip-text')} />
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
    },
    saveButton: {
        minHeight: 36,
        paddingVertical: theme.spacing[1],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[4],
    },
    section: {
        gap: theme.spacing[2],
        width: '100%',
    },
    goals: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: theme.spacing[2],
        width: '100%',
    },
}));
