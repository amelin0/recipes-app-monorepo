export {
    type PlanDay,
    type PlanDayStatus,
    type PlanDish,
    type PlanMeal,
    type PlanMealKey,
    type PlanMetric,
    type PlanMetricTone,
    type PlanTip,
} from '@/state/domains/meal-plan';

export type AddDishTabKey = 'dishes' | 'ingredients' | 'own' | 'favorites' | 'create';

/** Tab order of the dish picker (594:30108). */
export const ADD_DISH_TABS: AddDishTabKey[] = ['dishes', 'ingredients', 'own', 'favorites', 'create'];
