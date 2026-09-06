/** Units an ingredient amount can be expressed in. */
export enum MeasurementUnit {
    Gram = 'g',
    Milliliter = 'ml',
    Teaspoon = 'tsp',
    Tablespoon = 'tbsp',
    Cup = 'cup',
    Piece = 'pcs',
}

/** Which unit system a user reads values in. */
export enum MetricSystem {
    Metric = 'METRIC',
    Imperial = 'IMPERIAL',
}

/**
 * The three macronutrients, in grams. Calories are derived from these
 * (`calculateCalories` in `@dns/constants`) rather than stored independently,
 * so a recipe can never report a calorie count its macros contradict.
 */
export interface Macros {
    proteins: number;
    carbs: number;
    fats: number;
}
