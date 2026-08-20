import type { StateCreator } from 'zustand';

/** Colors a goal metric by how the day's plan relates to the target. */
export type PlanMetricTone = 'neutral' | 'progress' | 'positive' | 'negative';

export interface PlanMetric {
    current: number;
    target: number;
    /** Colors the 3pt progress bar. */
    tone: PlanMetricTone;
    /** Colors the value text — the design darkens it outside warning states. */
    valueTone?: PlanMetricTone;
}

/** Which advisory the goal card shows under the metrics (435:13917/14102/14287). */
export type PlanTip = 'low' | 'over' | 'near' | 'none';

export type PlanMealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const PLAN_MEAL_KEYS: PlanMealKey[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Розбирає day/meal з діплінка: невідомий день/прийом відкидається на
 * mon/lunch, щоб додавання не «зникало» в неіснуючому прийомі.
 */
export const resolvePlanTarget = (
    planWeek: PlanDay[],
    dayParam: unknown,
    mealParam: unknown,
): { day: string; meal: PlanMealKey } => {
    const dayValue = typeof dayParam === 'string' ? dayParam : undefined;
    const mealValue = typeof mealParam === 'string' ? mealParam : undefined;
    return {
        day: dayValue !== undefined && planWeek.some(planDay => planDay.key === dayValue) ? dayValue : 'mon',
        meal: PLAN_MEAL_KEYS.find(key => key === mealValue) ?? 'lunch',
    };
};

export interface PlanDishInput {
    id: string;
    emoji: string;
    name: string;
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
}

/** Збирає PlanDish з плоских КБЖВ — спільне для всіх шляхів додавання. */
export const buildPlanDish = (input: PlanDishInput): PlanDish => ({
    id: input.id,
    emoji: input.emoji,
    name: input.name,
    calories: input.calories,
    macros: [
        { key: 'protein', value: input.protein },
        { key: 'fats', value: input.fats },
        { key: 'carbs', value: input.carbs },
    ],
});

/**
 * Страви, додані через пікер, позначаються в id — так тік у пікері,
 * пошуку й деталях читається прямо зі стору, без локальних мап.
 */
const PICKED_PREFIX = 'picked:';

export const pickedPlanId = (pickerId: string) => `${PICKED_PREFIX}${pickerId}:${Date.now()}`;

/** Повертає pickerId, якщо страву додано пікером, інакше null. */
export const pickedIdOf = (planDishId: string): string | null => {
    if (!planDishId.startsWith(PICKED_PREFIX)) return null;
    const rest = planDishId.slice(PICKED_PREFIX.length);
    const sep = rest.lastIndexOf(':');
    return sep === -1 ? null : rest.slice(0, sep);
};

/** Страви прийому та лічильник доданих пікером — спільний селектор. */
export const pickedInMeal = (planWeek: PlanDay[], dayKey: string, mealKey: PlanMealKey) => {
    const dishes = planWeek.find(day => day.key === dayKey)?.meals.find(meal => meal.key === mealKey)?.dishes ?? [];
    const pickedIds = new Set<string>();
    dishes.forEach(dish => {
        const pickerId = pickedIdOf(dish.id);
        if (pickerId !== null) pickedIds.add(pickerId);
    });
    return {
        isAdded: (pickerId: string) => pickedIds.has(pickerId),
        addedCount: pickedIds.size,
        /** Останній доданий запис цієї страви — його знімає повторний тап. */
        lastPlanIdOf: (pickerId: string) => {
            for (let index = dishes.length - 1; index >= 0; index -= 1) {
                const dish = dishes[index];
                if (dish !== undefined && pickedIdOf(dish.id) === pickerId) return dish.id;
            }
            return null;
        },
    };
};

export type PlanMacroKey = 'protein' | 'fats' | 'carbs';

export interface PlanDishMacro {
    key: PlanMacroKey;
    /** Grams of this macro in the dish. */
    value: number;
}

/** One dish planned into a meal — the shape the MealCard widget renders. */
export interface PlanDish {
    id: string;
    emoji: string;
    name: string;
    calories: number;
    macros: PlanDishMacro[];
}

export interface PlanMeal {
    key: PlanMealKey;
    /** Planned time, absent for «Перекус» (961:59371). */
    time?: string;
    dishes: PlanDish[];
}

/** Colors the day tile in the week strip (961:59184). */
export type PlanDayStatus = 'ok' | 'over' | 'empty';

export interface PlanDay {
    key: string;
    /** «ПН» */
    weekday: string;
    /** «18» */
    date: string;
    status: PlanDayStatus;
    kcal: PlanMetric;
    protein: PlanMetric;
    fats: PlanMetric;
    carbs: PlanMetric;
    tip: PlanTip;
    meals: PlanMeal[];
}

const MEAL_TIMES: Record<PlanMealKey, string | undefined> = {
    breakfast: '11:00',
    lunch: '14:00',
    dinner: '19:00',
    snack: undefined,
};

const DISH_PANCAKES: PlanDish = {
    id: 'pancakes',
    emoji: '🥞',
    name: 'Панкейки',
    calories: 320,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 120 },
        { key: 'carbs', value: 23 },
    ],
};

const DISH_GREEK_SALAD: PlanDish = {
    id: 'greek-salad',
    emoji: '🥗',
    name: 'Грецький салат',
    calories: 350,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 0 },
        { key: 'carbs', value: 30 },
    ],
};

const DISH_SALMON: PlanDish = {
    id: 'salmon',
    emoji: '🐟',
    name: 'Смажений лосось',
    calories: 389,
    macros: [
        { key: 'protein', value: 150 },
        { key: 'fats', value: 120 },
        { key: 'carbs', value: 30 },
    ],
};

const emptyMeals = (): PlanMeal[] => PLAN_MEAL_KEYS.map(key => ({ key, time: MEAL_TIMES[key], dishes: [] }));

const filledMeals = (): PlanMeal[] => [
    { key: 'breakfast', time: MEAL_TIMES.breakfast, dishes: [{ ...DISH_PANCAKES }] },
    { key: 'lunch', time: MEAL_TIMES.lunch, dishes: [{ ...DISH_GREEK_SALAD }, { ...DISH_SALMON }] },
    {
        key: 'dinner',
        time: MEAL_TIMES.dinner,
        dishes: [
            { ...DISH_GREEK_SALAD, id: 'greek-salad-2' },
            { ...DISH_SALMON, id: 'salmon-2' },
        ],
    },
    { key: 'snack', dishes: [] },
];

const metric = (current: number, target: number, tone: PlanMetricTone, valueTone?: PlanMetricTone): PlanMetric => ({
    current,
    target,
    tone,
    valueTone,
});

/**
 * A mock week of plans — day statuses and metric tones are precomputed the way
 * the system will send them; the coloring thresholds stay with the backend.
 */
// TODO: replace with GET /meal-plan?week= once the API ships.
export const MOCK_PLAN_WEEK: PlanDay[] = [
    {
        key: 'mon',
        weekday: 'ПН',
        date: '18',
        status: 'ok',
        kcal: metric(1400, 1800, 'progress'),
        protein: metric(96, 100, 'positive'),
        fats: metric(96, 100, 'positive'),
        carbs: metric(96, 100, 'positive'),
        tip: 'none',
        meals: filledMeals(),
    },
    {
        key: 'tue',
        weekday: 'ВТ',
        date: '19',
        status: 'ok',
        kcal: metric(1750, 1800, 'positive'),
        protein: metric(96, 100, 'positive'),
        fats: metric(96, 100, 'positive'),
        carbs: metric(96, 100, 'positive'),
        tip: 'near',
        meals: filledMeals(),
    },
    {
        key: 'wed',
        weekday: 'СР',
        date: '20',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
    {
        key: 'thu',
        weekday: 'ЧТ',
        date: '21',
        status: 'ok',
        kcal: metric(1100, 1800, 'progress'),
        protein: metric(34, 100, 'progress', 'progress'),
        fats: metric(34, 100, 'progress', 'progress'),
        carbs: metric(110, 100, 'negative', 'negative'),
        tip: 'low',
        meals: filledMeals(),
    },
    {
        key: 'fri',
        weekday: 'ПТ',
        date: '22',
        status: 'over',
        kcal: metric(2100, 1800, 'negative', 'negative'),
        protein: metric(34, 100, 'progress', 'progress'),
        fats: metric(34, 100, 'progress', 'progress'),
        carbs: metric(110, 100, 'negative', 'negative'),
        tip: 'over',
        meals: filledMeals(),
    },
    {
        key: 'sat',
        weekday: 'СБ',
        date: '23',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
    {
        key: 'sun',
        weekday: 'НД',
        date: '24',
        status: 'empty',
        kcal: metric(0, 1800, 'neutral'),
        protein: metric(0, 100, 'neutral'),
        fats: metric(0, 100, 'neutral'),
        carbs: metric(0, 100, 'neutral'),
        tip: 'none',
        meals: emptyMeals(),
    },
];

export interface MealPlanSlice {
    /** The mock week — the dish picker and the plan tab edit it together. */
    planWeek: PlanDay[];
    addPlanDishes: (dayKey: string, mealKey: PlanMealKey, dishes: PlanDish[]) => void;
    removePlanDish: (dayKey: string, mealKey: PlanMealKey, dishId: string) => void;
    resetPlanWeek: () => void;
}

const mapMeal = (
    week: PlanDay[],
    dayKey: string,
    mealKey: PlanMealKey,
    update: (dishes: PlanDish[]) => PlanDish[],
): PlanDay[] =>
    week.map(day =>
        day.key === dayKey
            ? {
                  ...day,
                  meals: day.meals.map(meal =>
                      meal.key === mealKey ? { ...meal, dishes: update(meal.dishes) } : meal,
                  ),
              }
            : day,
    );

// TODO: replace with the meal-plan API (GET /meal-plan?week=, POST/DELETE dishes).
export const createMealPlanSlice: StateCreator<MealPlanSlice, [], [], MealPlanSlice> = set => ({
    planWeek: MOCK_PLAN_WEEK,

    addPlanDishes: (dayKey, mealKey, dishes) =>
        set(state => ({ planWeek: mapMeal(state.planWeek, dayKey, mealKey, current => [...current, ...dishes]) })),

    removePlanDish: (dayKey, mealKey, dishId) =>
        set(state => ({
            planWeek: mapMeal(state.planWeek, dayKey, mealKey, current => current.filter(dish => dish.id !== dishId)),
        })),

    resetPlanWeek: () => set(() => ({ planWeek: MOCK_PLAN_WEEK })),
});
