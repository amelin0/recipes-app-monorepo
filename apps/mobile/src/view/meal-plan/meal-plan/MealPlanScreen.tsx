import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppScreen, AppText, QueryState } from '@/shared/ui/components';
import { MealCard } from '@/shared/ui/widgets';
import { useAppTranslation } from '@/shared/utils/translations';

import BasketAddIcon from '../../../../assets/icons/basket-add.svg';
import CopyIcon from '../../../../assets/icons/copy.svg';
import { PlanActionButton, PlanGoalCard, WeekStrip } from './components';

import { useMealPlanScreen } from './useMealPlanScreen';

/** План харчування — the meal-plan tab (961:59184, 435:13191). */
export const MealPlanScreen = () => {
    const { t } = useAppTranslation(['meal-plan']);
    const {
        week,
        day,
        isLoading,
        isError,
        handleRetry,
        selectedDayKey,
        setSelectedDayKey,
        hasDishes,
        hasPendingForList,
        resolveDishAction,
        mealHasDetails,
        handleChangeGoal,
        handleMealPress,
        handleAddDish,
        handleToggleBasket,
        handleDeleteDish,
        isDishBusy,
        handleAddAllToList,
        handleCopyPlan,
    } = useMealPlanScreen();

    return (
        <AppScreen>
            <View style={styles.header}>
                <AppText variant="titleMedium">{t('meal-plan:screen.title')}</AppText>
            </View>

            <QueryState isLoading={isLoading} isError={isError} onRetry={handleRetry}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <WeekStrip days={week} selectedKey={selectedDayKey} onSelect={setSelectedDayKey} />

                    {day ? <PlanGoalCard day={day} onChangeGoal={handleChangeGoal} /> : null}

                    {day?.meals.map(meal => (
                        <MealCard
                            key={`${day.key}-${meal.key}`}
                            title={t(`meal-plan:meals.${meal.key}`)}
                            time={meal.time}
                            dishes={meal.dishes}
                            resolveDishAction={() => resolveDishAction()}
                            dishSwipeAction="delete"
                            onPress={mealHasDetails(meal.key) ? handleMealPress : undefined}
                            onAdd={() => handleAddDish(meal.key)}
                            onDishAction={handleToggleBasket}
                            onDishSwipe={dishId => handleDeleteDish(meal.key, dishId)}
                            isDishBusy={dish => isDishBusy(dish.id)}
                        />
                    ))}

                    <View style={styles.actions}>
                        <PlanActionButton
                            icon={BasketAddIcon}
                            label={t('meal-plan:screen.add-to-list')}
                            // Вимкнена, коли всі страви дня вже в списку; нова
                            // страва знову вмикає її.
                            disabled={!hasPendingForList}
                            onPress={handleAddAllToList}
                        />
                        <PlanActionButton
                            icon={CopyIcon}
                            label={t('meal-plan:screen.copy-to-days')}
                            disabled={!hasDishes}
                            onPress={handleCopyPlan}
                        />
                    </View>
                </ScrollView>
            </QueryState>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    header: {
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[2],
        gap: theme.spacing[1],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: 120,
        gap: theme.spacing[4],
    },
    actions: {
        gap: theme.spacing[4],
        width: '100%',
    },
}));
