import React from 'react';
import { ScrollView } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, SectionHeader } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { DailyGoalCard, HomeHeader, MealCard, StepsCard, WaterCard } from './components';
import { useHomeScreen } from './useHomeScreen';

export const HomeScreen = () => {
    const { t } = useAppTranslation(['tracking']);
    const {
        initials,
        notificationsCount,
        dateLabel,
        calories,
        macros,
        meals,
        water,
        steps,
        handleAvatarPress,
        handleNotificationsPress,
        handleGoalPress,
        handleMealPress,
        handleAddMeal,
        handleDishAction,
        handleWaterPress,
        handleAddWater,
        handleStepsPress,
        handleAddSteps,
    } = useHomeScreen();

    return (
        <AppScreen>
            <HomeHeader
                initials={initials}
                dateLabel={dateLabel}
                notificationsCount={notificationsCount}
                onAvatarPress={handleAvatarPress}
                onNotificationsPress={handleNotificationsPress}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <DailyGoalCard
                    caloriesCurrent={calories.current}
                    caloriesTarget={calories.target}
                    macros={macros}
                    onPress={handleGoalPress}
                />

                <SectionHeader title={t('tracking:home.today-ration')} />

                {meals.map(meal => (
                    <MealCard
                        key={meal.key}
                        title={t(`tracking:home.meals.${meal.key}`)}
                        time={meal.time}
                        dishes={meal.dishes}
                        dishAction={meal.dishAction}
                        highlighted={meal.current}
                        onPress={meal.hasDetails ? () => handleMealPress(meal.key) : undefined}
                        onAdd={() => handleAddMeal(meal.key)}
                        onDishAction={dishId => handleDishAction(meal.key, dishId)}
                    />
                ))}

                <WaterCard
                    current={water.current}
                    target={water.target}
                    onPress={handleWaterPress}
                    onAdd={handleAddWater}
                />

                <StepsCard
                    current={steps.current}
                    target={steps.target}
                    onPress={handleStepsPress}
                    onAdd={handleAddSteps}
                />
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
}));
