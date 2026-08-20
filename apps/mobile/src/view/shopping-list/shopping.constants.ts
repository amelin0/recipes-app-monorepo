/** Fixed render order of shopping list groups — labels in `shopping:categories.*`. */
export const SHOPPING_CATEGORY_ORDER = ['meat', 'flour', 'dairy', 'cereals', 'vegetables', 'fruits', 'other'];

export interface CatalogProduct {
    /** Key into `shopping:products.*`. */
    key: string;
    emoji: string;
    categoryKey: string;
    kcalPer100: number;
    /** Grams in one piece — drives the «≈ Nг» hint (665:11895). */
    pieceGrams?: number;
}

// TODO: replace with GET /products once the API ships. Order mirrors the
// «Додати продукти» Figma mock (435:16021).
export const PRODUCT_CATALOG: CatalogProduct[] = [
    { key: 'chicken-fillet', emoji: '🍗', categoryKey: 'meat', kcalPer100: 110, pieceGrams: 89 },
    { key: 'egg', emoji: '🥚', categoryKey: 'other', kcalPer100: 155 },
    { key: 'tomato', emoji: '🍅', categoryKey: 'vegetables', kcalPer100: 18 },
    { key: 'rice', emoji: '🍚', categoryKey: 'cereals', kcalPer100: 130 },
    { key: 'buckwheat', emoji: '🌾', categoryKey: 'cereals', kcalPer100: 343 },
    { key: 'carrot', emoji: '🥕', categoryKey: 'vegetables', kcalPer100: 41 },
    { key: 'apple', emoji: '🍎', categoryKey: 'fruits', kcalPer100: 52 },
    { key: 'broccoli', emoji: '🥦', categoryKey: 'vegetables', kcalPer100: 34 },
    { key: 'sweet-potato', emoji: '🍠', categoryKey: 'vegetables', kcalPer100: 86 },
    { key: 'avocado', emoji: '🥑', categoryKey: 'fruits', kcalPer100: 160 },
    { key: 'cheese', emoji: '🧀', categoryKey: 'dairy', kcalPer100: 350 },
    { key: 'mushrooms', emoji: '🍄', categoryKey: 'vegetables', kcalPer100: 22 },
    { key: 'corn', emoji: '🌽', categoryKey: 'vegetables', kcalPer100: 86 },
    { key: 'potato', emoji: '🥔', categoryKey: 'vegetables', kcalPer100: 77 },
    { key: 'watermelon', emoji: '🍉', categoryKey: 'fruits', kcalPer100: 30 },
    { key: 'spinach', emoji: '🥬', categoryKey: 'vegetables', kcalPer100: 23 },
    { key: 'garlic', emoji: '🧄', categoryKey: 'vegetables', kcalPer100: 149 },
];

export type AmountUnitKey = 'portion' | 'piece' | 'gram';

export interface AmountUnitConfig {
    /** Stepper increment. */
    step: number;
    min: number;
    max: number;
    initial: number;
    /** Grams in one unit — конвертація в грами для списку. */
    grams: number;
}

/** Stepper presets per unit tab — «Порція | Штука | Грам» (Figma 435:16097). */
export const AMOUNT_UNITS: Record<AmountUnitKey, AmountUnitConfig> = {
    portion: { step: 0.5, min: 0.5, max: 20, initial: 1, grams: 250 },
    piece: { step: 1, min: 1, max: 100, initial: 1, grams: 100 },
    gram: { step: 50, min: 50, max: 10000, initial: 50, grams: 1 },
};

export const AMOUNT_UNIT_KEYS: AmountUnitKey[] = ['portion', 'piece', 'gram'];
