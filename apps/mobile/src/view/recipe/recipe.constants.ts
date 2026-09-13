import type { ImageSourcePropType } from 'react-native';

export interface RecipeCategory {
    key: string;
    image: ImageSourcePropType;
}

/**
 * Dish-type categories (642:39792) — labels live in `recipes:rail-categories.*`.
 * Shared by the recipes-tab rail, the search grid and, as emoji chips, the
 * filter screen.
 */
/**
 * Artwork for the category rail, keyed by the API's own slug. The reference
 * payload carries an `imageUrl`, but it is empty for every category today, so
 * the shipped illustrations stand in — and the map is by slug precisely so
 * that a category the API adds simply has no tile rather than breaking one.
 */
export const RAIL_CATEGORY_IMAGES: Record<string, number> = {
    'salty-breakfast': require('../../../assets/images/categories/rail-savory-breakfast.png'),
    'sweet-breakfast': require('../../../assets/images/categories/rail-sweet-breakfast.png'),
    lunch: require('../../../assets/images/categories/rail-lunch.png'),
    dinner: require('../../../assets/images/categories/rail-dinner.png'),
    snacks: require('../../../assets/images/categories/rail-snacks.png'),
    salads: require('../../../assets/images/categories/rail-salads.png'),
    pasta: require('../../../assets/images/categories/rail-pasta.png'),
    bowls: require('../../../assets/images/categories/rail-bowls.png'),
    smoothies: require('../../../assets/images/categories/rail-smoothies.png'),
    desserts: require('../../../assets/images/categories/rail-desserts.png'),
    baking: require('../../../assets/images/categories/rail-baking.png'),
};

/** Stands in for a recipe with no photo of its own. */
export const RECIPE_PLACEHOLDER_IMAGE = require('../../../assets/images/recipes/mock-1.jpg');

/** Emoji companions for the filter option chips (594:43425). */
/**
 * Emoji companions for the category chips on the filter screen (594:43425).
 * «Перекуси» has no emoji in the mock — an obvious slip among 10 emoji chips,
 * so the app gives it one (recorded in the spec).
 */
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
    /** Пікерні шляхи додають страву в план з цією піктограмою. */
    emoji: string;
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

export interface SearchIngredientResult {
    id: string;
    title: string;
    subtitle: string;
    protein: number;
    fats: number;
    carbs: number;
}

export interface SearchDishResult {
    id: string;
    title: string;
    emoji: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

export interface MockCreatedDish {
    id: string;
    title: string;
    cuisine: string;
    emoji: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
    /** «Вага: 634г» on the created-dish receipt (628:27032). */
    weightGrams: number;
    /** «15:00» in the timer tag. */
    cookTime: string;
}

/** Кухні шторки «Кухня» у порядку дизайну (626:24661). */
export const CREATE_DISH_CUISINES = [
    'cuisine-ukrainian',
    'cuisine-greek',
    'cuisine-italian',
    'cuisine-mexican',
    'cuisine-georgian',
    'cuisine-asian',
] as const;

export interface CreateDishIngredient {
    id: string;
    emoji: string;
    name: string;
    protein: number;
    fats: number;
    carbs: number;
    /** Editable weight, grams (594:31930). */
    grams: number;
}

export interface DishStep {
    id: string;
    title: string;
    description: string;
    /** id-шники інгредієнтів форми, потрібні на цьому кроці (594:32250). */
    ingredientIds: string[];
    /** Хвилини кроку, від 1 (594:32174). */
    minutes: number;
}

/** Мок «зробленого» фото — до інтеграції камери/галереї (594:32413). */
