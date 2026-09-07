import { Macros, MeasurementUnit } from '@dns/shared-types';

/** Atwater factors: kilocalories released per gram of each macronutrient. */
export const KCAL_PER_GRAM = Object.freeze({
    proteins: 4,
    carbs: 4,
    fats: 9,
});

/**
 * The single definition of a calorie count in this system.
 *
 * Calories are always derived, never stored as an independent number: a
 * recipe whose macros are edited must not keep reporting the calories of
 * its previous version. Rounded to a whole kcal because every surface —
 * recipe card, daily total, goal progress — renders integers.
 */
export const calculateCalories = ({ proteins, carbs, fats }: Macros): number =>
    Math.round(proteins * KCAL_PER_GRAM.proteins + carbs * KCAL_PER_GRAM.carbs + fats * KCAL_PER_GRAM.fats);

/** Units whose amount is a mass or volume, and can therefore be scaled and summed across recipes. */
export const CONTINUOUS_UNITS: readonly MeasurementUnit[] = Object.freeze([
    MeasurementUnit.Gram,
    MeasurementUnit.Milliliter,
]);

/**
 * Shopping-list aggregation sums amounts per (ingredient, unit) pair rather
 * than converting between units: a teaspoon of salt and 5 g of salt are two
 * lines, because the conversion depends on the ingredient's density and we
 * do not carry densities.
 */
export const MEASUREMENT_UNITS: readonly MeasurementUnit[] = Object.freeze(Object.values(MeasurementUnit));
