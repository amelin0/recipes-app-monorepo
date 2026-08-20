import type { ImageSourcePropType } from 'react-native';

export interface RecipeCategory {
    key: string;
    image: ImageSourcePropType;
}

/** 12 popular categories — labels live in `recipes:categories.*`. */
export const RECIPE_CATEGORIES: RecipeCategory[] = [
    { key: 'breakfast', image: require('../../../assets/images/categories/breakfast.png') },
    { key: 'lunch', image: require('../../../assets/images/categories/lunch.png') },
    { key: 'dinner', image: require('../../../assets/images/categories/dinner.png') },
    { key: 'vegan', image: require('../../../assets/images/categories/vegan.png') },
    { key: 'high-protein', image: require('../../../assets/images/categories/high-protein.png') },
    { key: 'low-carb', image: require('../../../assets/images/categories/low-carb.png') },
    { key: 'low-fat', image: require('../../../assets/images/categories/low-fat.png') },
    { key: 'low-calorie', image: require('../../../assets/images/categories/low-calorie.png') },
    { key: 'sugar-free', image: require('../../../assets/images/categories/sugar-free.png') },
    { key: 'vegetarian', image: require('../../../assets/images/categories/vegetarian.png') },
    { key: 'few-ingredients', image: require('../../../assets/images/categories/few-ingredients.png') },
    { key: 'quick', image: require('../../../assets/images/categories/quick.png') },
];

/**
 * Dish-type rail on the recipes tab (642:39792) — labels live in
 * `recipes:rail-categories.*`. The filter and search screens still run the
 * older diet-type taxonomy above; the two sets converge once the API defines
 * the canonical category list.
 */
export const RECIPE_RAIL_CATEGORIES: RecipeCategory[] = [
    { key: 'savory-breakfast', image: require('../../../assets/images/categories/rail-savory-breakfast.png') },
    { key: 'sweet-breakfast', image: require('../../../assets/images/categories/rail-sweet-breakfast.png') },
    { key: 'lunch', image: require('../../../assets/images/categories/rail-lunch.png') },
    { key: 'dinner', image: require('../../../assets/images/categories/rail-dinner.png') },
    { key: 'snacks', image: require('../../../assets/images/categories/rail-snacks.png') },
    { key: 'salads', image: require('../../../assets/images/categories/rail-salads.png') },
    { key: 'pasta', image: require('../../../assets/images/categories/rail-pasta.png') },
    { key: 'bowls', image: require('../../../assets/images/categories/rail-bowls.png') },
    { key: 'smoothies', image: require('../../../assets/images/categories/rail-smoothies.png') },
    { key: 'desserts', image: require('../../../assets/images/categories/rail-desserts.png') },
    { key: 'baking', image: require('../../../assets/images/categories/rail-baking.png') },
];

/** Filter option keys — labels live in `recipes:options.*`. */
export const MEAL_OPTIONS = [
    'meal-breakfast',
    'meal-lunch',
    'meal-dinner',
    'meal-snack',
    'meal-dessert',
    'meal-salad',
    'meal-shake',
    'meal-soup',
    'meal-smoothie',
];

export const METHOD_OPTIONS = [
    'method-quick',
    'method-on-the-go',
    'method-few-ingredients',
    'method-baking',
    'method-casserole',
    'method-simple',
    'method-basic',
];

export const DIET_OPTIONS = [
    'diet-vegetarian',
    'diet-vegan',
    'diet-low-carb',
    'diet-low-fat',
    'diet-low-calorie',
    'diet-high-protein',
    'diet-high-fiber',
    'diet-keto',
    'diet-pescatarian',
    'diet-sugar-free',
    'diet-lactose-free',
    'diet-gluten-free',
    'diet-detox',
];

export const INGREDIENT_OPTIONS = [
    'ingredient-vegetables',
    'ingredient-fruits',
    'ingredient-meat',
    'ingredient-fish',
    'ingredient-sweets',
];

export interface MealIngredient {
    id: string;
    emoji: string;
    name: string;
    protein: number;
    fats: number;
    carbs: number;
    grams: number;
}

export interface MealStep {
    id: string;
    title: string;
    description: string;
    ingredients: string[];
    minutes: number;
}

export interface MockMealDetail {
    id: string;
    title: string;
    cuisine: string;
    minutes: number;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
    image: ImageSourcePropType;
    ingredients: MealIngredient[];
    steps: MealStep[];
    /** Nutrition of a single portion — drives the portion picker math. */
    perPortion: { grams: number; kcal: number; protein: number; fats: number; carbs: number };
}

// TODO: replace with GET /recipes/:id once the API ships.
export const MOCK_MEAL_DETAIL: MockMealDetail = {
    id: 'meal-1',
    title: 'Грецький салат',
    cuisine: 'Середземноморська кухня',
    minutes: 15,
    kcal: 1859,
    protein: 250,
    fats: 267,
    carbs: 180,
    image: require('../../../assets/images/recipes/mock-2.jpg'),
    ingredients: [
        { id: 'ing-1', emoji: '🥒', name: 'Огірки', protein: 1, fats: 0, carbs: 4, grams: 150 },
        { id: 'ing-2', emoji: '🍅', name: 'Помідори', protein: 2, fats: 0, carbs: 6, grams: 150 },
        { id: 'ing-3', emoji: '🧀', name: 'Сир Фета', protein: 7, fats: 12, carbs: 2, grams: 150 },
        { id: 'ing-4', emoji: '🫒', name: 'Оливки', protein: 0, fats: 5, carbs: 1, grams: 150 },
    ],
    steps: [
        {
            id: 'step-1',
            title: 'Підготовка овочів',
            description:
                'Помийте огірки та помідори. Наріжте огірки півкільцями, помідори — великими шматочками. Складіть у глибокий салатник.',
            ingredients: ['Огірки', 'Помідори'],
            minutes: 5,
        },
        {
            id: 'step-2',
            title: 'Сир та оливки',
            description:
                'Наріжте фету великими кубиками. Додайте оливки та сир до овочів, обережно перемішайте, щоб сир не розсипався.',
            ingredients: ['Сир Фета', 'Оливки'],
            minutes: 5,
        },
        {
            id: 'step-3',
            title: 'Заправка та подача',
            description:
                'Полийте салат оливковою олією, посипте орегано та свіжомеленим перцем. Подавайте одразу після приготування.',
            ingredients: ['Оливки'],
            minutes: 5,
        },
    ],
    perPortion: { grams: 108, kcal: 337, protein: 17, fats: 50, carbs: 5 },
};

export interface MockRecipe {
    id: string;
    title: string;
    minutes: number;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
    image: ImageSourcePropType;
    isFavorite: boolean;
    isOwn: boolean;
}

// TODO: replace with API data (recipe domain).
export const MOCK_RECIPES: MockRecipe[] = [
    {
        id: '1',
        title: 'Вівсяна каша з ягодами та медом',
        minutes: 15,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-1.jpg'),
        isFavorite: true,
        isOwn: false,
    },
    {
        id: '2',
        title: 'Салат з кіноа, авокадо і грильованим курчам',
        minutes: 10,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-2.jpg'),
        isFavorite: true,
        isOwn: true,
    },
    {
        id: '3',
        title: 'Вівсяна каша з ягодами та медом',
        minutes: 15,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-3.jpg'),
        isFavorite: false,
        isOwn: false,
    },
    {
        id: '4',
        title: 'Салат з кіноа, авокадо і грильованим курчам',
        minutes: 10,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-4.jpg'),
        isFavorite: false,
        isOwn: true,
    },
    {
        id: '5',
        title: 'Вівсяна каша з ягодами та медом',
        minutes: 15,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-1.jpg'),
        isFavorite: false,
        isOwn: false,
    },
    {
        id: '6',
        title: 'Салат з кіноа, авокадо і грильованим курчам',
        minutes: 10,
        kcal: 150,
        protein: 150,
        fats: 120,
        carbs: 30,
        image: require('../../../assets/images/recipes/mock-2.jpg'),
        isFavorite: false,
        isOwn: false,
    },
];
