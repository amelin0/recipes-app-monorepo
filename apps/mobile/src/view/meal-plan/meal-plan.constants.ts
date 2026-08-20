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

/** «18 - 24 Травня» in the header subtitle (961:59383). */
export const MOCK_PLAN_WEEK_RANGE = '18 - 24 Травня';

export interface CopyPlanDay {
    key: string;
    /** «Вівторок» */
    name: string;
    /** «19 Травня» */
    date: string;
}

/** Days the plan can be copied to, split by week tab (435:14472, 435:14675). */
// TODO: replace with the plan-copy targets from GET /meal-plan?week= once the API ships.
export const MOCK_COPY_THIS_WEEK: CopyPlanDay[] = [
    { key: 'tue', name: 'Вівторок', date: '19 Травня' },
    { key: 'wed', name: 'Середа', date: '20 Травня' },
    { key: 'thu', name: 'Четвер', date: '21 Травня' },
    { key: 'fri', name: 'П’ятниця', date: '22 Травня' },
    { key: 'sat', name: 'Субота', date: '23 Травня' },
    { key: 'sun', name: 'Неділя', date: '24 Травня' },
];

export const MOCK_COPY_NEXT_WEEK: CopyPlanDay[] = [
    { key: 'next-mon', name: 'Понеділок', date: '25 Травня' },
    { key: 'next-tue', name: 'Вівторок', date: '26 Травня' },
    { key: 'next-wed', name: 'Середа', date: '27 Травня' },
    { key: 'next-thu', name: 'Четвер', date: '28 Травня' },
    { key: 'next-fri', name: 'П’ятниця', date: '29 Травня' },
    { key: 'next-sat', name: 'Субота', date: '30 Травня' },
    { key: 'next-sun', name: 'Неділя', date: '31 Травня' },
];

export type AddDishTabKey = 'dishes' | 'ingredients' | 'own' | 'favorites' | 'create';

/** Tab order of the dish picker (594:30108). */
export const ADD_DISH_TABS: AddDishTabKey[] = ['dishes', 'ingredients', 'own', 'favorites', 'create'];

export interface PickerDish {
    id: string;
    title: string;
    emoji: string;
    /** Pastel thumb tint from the mock (594:30155). */
    thumbBg: string;
    /** Rail-category key — lets the quick rail pick filter the mock list. */
    category: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

export interface PickerIngredient {
    id: string;
    title: string;
    /** «1 порція(30мл) 350 ккал» */
    subtitle: string;
    protein: number;
    fats: number;
    carbs: number;
}

/** Mock total for un-narrowed lists and the ingredients tab (594:41618, 594:30951). */
export const MOCK_PICKER_RESULTS_COUNT = 239;

// TODO: replace with GET /recipes?meal= once the API ships.
export const MOCK_PICKER_DISHES: PickerDish[] = [
    {
        id: 'greek-salad',
        title: 'Грецький салат',
        emoji: '🥗',
        thumbBg: '#FCE8E8',
        category: 'salads',
        kcal: 350,
        protein: 150,
        fats: 0,
        carbs: 30,
    },
    {
        id: 'salmon',
        title: 'Смажений лосось',
        emoji: '🐟',
        thumbBg: '#E8F1FC',
        category: 'dinner',
        kcal: 389,
        protein: 150,
        fats: 120,
        carbs: 30,
    },
    {
        id: 'rice-chicken',
        title: 'Рис з овочами та куркою',
        emoji: '🍛',
        thumbBg: '#FCF3E8',
        category: 'lunch',
        kcal: 420,
        protein: 180,
        fats: 90,
        carbs: 50,
    },
    {
        id: 'pork-steak',
        title: 'Стейк зі свинини',
        emoji: '🥩',
        thumbBg: '#FCE8EE',
        category: 'lunch',
        kcal: 500,
        protein: 220,
        fats: 160,
        carbs: 10,
    },
    {
        id: 'pumpkin-soup',
        title: 'Гарбузовий суп-пюре',
        emoji: '🍲',
        thumbBg: '#F0FCE8',
        category: 'lunch',
        kcal: 250,
        protein: 50,
        fats: 15,
        carbs: 40,
    },
    {
        id: 'pesto-pasta',
        title: 'Паста з соусом песто',
        emoji: '🍝',
        thumbBg: '#FCF3E8',
        category: 'pasta',
        kcal: 480,
        protein: 120,
        fats: 180,
        carbs: 60,
    },
];

// TODO: replace with GET /products/search once the API ships. «Свіє яблуко» з
// макета виправлено на «Свіже» (spec).
export const MOCK_PICKER_INGREDIENTS: PickerIngredient[] = [
    { id: 'espresso', title: 'Кава еспресо', subtitle: '1 порція(30мл) 350 ккал', protein: 150, fats: 0, carbs: 30 },
    {
        id: 'white-rice',
        title: 'Білий рис, приготовлений',
        subtitle: '1 порція(47г) 2 ккал',
        protein: 0,
        fats: 0,
        carbs: 0.5,
    },
    { id: 'milk', title: 'Молоко 2.5%', subtitle: '100 мл 50 ккал', protein: 3.3, fats: 2.5, carbs: 5 },
    {
        id: 'chocolate-cake',
        title: 'Шоколадний торт',
        subtitle: '1 шматок(80г) 350 ккал',
        protein: 5,
        fats: 20,
        carbs: 35,
    },
    { id: 'white-bread', title: 'Білий хліб', subtitle: '1 скибка(30г) 80 ккал', protein: 3, fats: 1, carbs: 15 },
    { id: 'apple', title: 'Свіже яблуко', subtitle: '1 шт.(150г) 95 ккал', protein: 0.5, fats: 0.3, carbs: 25 },
];
