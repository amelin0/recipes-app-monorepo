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

/**
 * Filter option keys — plain labels live in `recipes:options.*`, the emoji
 * companions in OPTION_EMOJI (the applied-filter chips drop the emoji,
 * 594:44769).
 */
export const PRODUCT_OPTIONS = [
    'product-vegetables',
    'product-fruits',
    'product-meat',
    'product-fish',
    'product-sweets',
    'product-dairy',
];

export const CUISINE_OPTIONS = [
    'cuisine-georgian',
    'cuisine-italian',
    'cuisine-greek',
    'cuisine-mexican',
    'cuisine-asian',
    'cuisine-ukrainian',
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

/** Emoji companions for the filter option chips (594:43425). */
export const OPTION_EMOJI: Record<string, string> = {
    'product-vegetables': '🥦',
    'product-fruits': '🍓',
    'product-meat': '🥩',
    'product-fish': '🐟',
    'product-sweets': '🍬',
    'product-dairy': '🥛',
    'cuisine-georgian': '🇬🇪',
    'cuisine-italian': '🇮🇹',
    'cuisine-greek': '🇬🇷',
    'cuisine-mexican': '🇲🇽',
    'cuisine-asian': '🌏',
    'cuisine-ukrainian': '🇺🇦',
    'diet-vegetarian': '🌿',
    'diet-vegan': '🌱',
    'diet-low-carb': '🥦',
    'diet-low-fat': '🫀',
    'diet-low-calorie': '🥬',
    'diet-high-protein': '💪',
    'diet-high-fiber': '🌾',
    'diet-keto': '🥑',
    'diet-pescatarian': '🐟',
    'diet-sugar-free': '🍭',
    'diet-lactose-free': '🥛',
    'diet-gluten-free': '🌾',
    'diet-detox': '🌿',
};

/** «Пошук за інгредієнтами» quick picks — labels in `recipes:ingredients.*`. */
export const FILTER_INGREDIENTS = [
    'spinach',
    'beans',
    'tomatoes',
    'beetroot',
    'cabbage',
    'carrot',
    'onion',
    'pepper',
    'corn',
    'radish',
    'cucumbers',
    'celery',
    'garlic',
    'parsley',
    'zucchini',
];

/**
 * Full ingredient catalog behind «Всі ›» (626:22930) — labels in
 * `recipes:ingredients.*`; 'parsley' is shared with the quick picks above.
 * The mock's «Кресс-салат» duplicate and two spelling slips are corrected in
 * the labels (recorded in the spec).
 */
// TODO: replace with GET /ingredients?q= once the API ships.
export const INGREDIENT_CATALOG = [
    'kale',
    'arugula',
    'watercress',
    'romaine',
    'parsley',
    'cilantro',
    'basil',
    'mint',
    'thyme',
    'rosemary',
    'tarragon',
    'chard-leaves',
    'sorrel-leaves',
    'dandelion-leaves',
    'curly-parsley',
    'coriander',
    'marjoram',
    'estragon',
    'ramson-garlic',
    'mint-leaves',
    'beet-tops',
    'iceberg',
    'lettuce',
    'wild-arugula',
    'batavia',
    'leaf-cabbage',
    'carrot-leaves',
    'fennel-leaves',
    'chicory-leaves',
    'beet-leaves',
    'carrot-tops',
    'amaranth-leaves',
    'mizuna',
    'corn-salad',
    'napa-cabbage',
    'spinach-matador',
    'spinach-flora',
    'spinach-oktava',
    'spinach-malakhit',
    'spinach-zelenyi',
    'eggplant',
    'eggplant-puree',
];

/**
 * Emoji companions for the category chips on the filter screen (594:43425).
 * «Перекуси» has no emoji in the mock — an obvious slip among 10 emoji chips,
 * so the app gives it one (recorded in the spec).
 */
export const RAIL_CATEGORY_EMOJI: Record<string, string> = {
    'savory-breakfast': '🥓',
    'sweet-breakfast': '🍩',
    lunch: '🍲',
    dinner: '🍽️',
    snacks: '🍌',
    salads: '🥗',
    pasta: '🍝',
    bowls: '🥣',
    smoothies: '🍹',
    desserts: '🍰',
    baking: '🥐',
};

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

// TODO: replace with GET /recipes/:id once the API ships.
export const MOCK_MEAL_DETAIL: MockMealDetail = {
    id: 'meal-1',
    title: 'Грецький салат',
    emoji: '🥗',
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

// TODO: replace with GET /products/search?q= once the API ships.
export const MOCK_SEARCH_INGREDIENTS: SearchIngredientResult[] = [
    { id: 'ing-1', title: 'Банан', subtitle: '1 шт(89г) 350 ккал', protein: 150, fats: 0, carbs: 30 },
];

// TODO: replace with GET /recipes/search?q= once the API ships.
export const MOCK_SEARCH_DISHES: SearchDishResult[] = [
    {
        id: 'dish-1',
        title: 'Банановий пиріг',
        emoji: '🍰',
        kcal: 400,
        protein: 150,
        fats: 0,
        carbs: 30,
    },
];

// TODO: replace with GET /recipes?category= once the API ships.
export const MOCK_CATEGORY_DISHES: SearchDishResult[] = [
    {
        id: 'cat-1',
        title: 'Грецький салат',
        emoji: '🥗',
        kcal: 350,
        protein: 150,
        fats: 0,
        carbs: 30,
    },
    {
        id: 'cat-2',
        title: 'Смажений лосось',
        emoji: '🐟',
        kcal: 389,
        protein: 150,
        fats: 120,
        carbs: 30,
    },
    {
        id: 'cat-3',
        title: 'Рис з овочами та куркою',
        emoji: '🍛',
        kcal: 420,
        protein: 180,
        fats: 90,
        carbs: 50,
    },
    {
        id: 'cat-4',
        title: 'Стейк зі свинини',
        emoji: '🥩',
        kcal: 500,
        protein: 220,
        fats: 160,
        carbs: 10,
    },
    {
        id: 'cat-5',
        title: 'Гарбузовий суп-пюре',
        emoji: '🍲',
        kcal: 250,
        protein: 50,
        fats: 15,
        carbs: 40,
    },
    {
        id: 'cat-6',
        title: 'Паста з соусом песто',
        emoji: '🍝',
        kcal: 480,
        protein: 120,
        fats: 180,
        carbs: 60,
    },
];

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

// TODO: replace with the POST /recipes response once the create-dish flow ships.
export const MOCK_CREATED_DISH: MockCreatedDish = {
    id: 'created-greek-salad',
    title: 'Грецький салат',
    cuisine: 'Грецька кухня',
    emoji: '🥗',
    kcal: 1859,
    protein: 250,
    fats: 267,
    carbs: 180,
    weightGrams: 634,
    cookTime: '15:00',
};

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

// TODO: replace with the add-ingredient flow output once it ships (594:31929).
export const MOCK_CREATE_DISH_INGREDIENTS: CreateDishIngredient[] = [
    { id: 'cucumbers', emoji: '🥒', name: 'Огірки', protein: 1, fats: 0, carbs: 4, grams: 200 },
    { id: 'tomatoes', emoji: '🍅', name: 'Помідори', protein: 1, fats: 0, carbs: 4, grams: 200 },
    { id: 'feta', emoji: '🧀', name: 'Сир Фета', protein: 1, fats: 0, carbs: 4, grams: 50 },
    { id: 'olives', emoji: '🫒', name: 'Оливки', protein: 1, fats: 0, carbs: 4, grams: 30 },
];

/** Мок «зробленого» фото — до інтеграції камери/галереї (594:32413). */
export const MOCK_CREATE_DISH_PHOTO = require('../../../assets/images/recipes/create-dish-photo.jpg');
