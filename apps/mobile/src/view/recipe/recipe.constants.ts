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
