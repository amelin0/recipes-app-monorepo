/**
 * How much of a catalogue one request may ask for.
 *
 * A ceiling rather than a suggestion: `limit` arrives from a query string, and
 * without one a single request could ask the server to assemble the whole
 * catalogue with its joins.
 */
export const CATALOG_PAGE_SIZE = Object.freeze({
    default: 20,
    max: 50,
});

/**
 * The calorie slider on the filter screen (recipe-filters FR-003): per serving,
 * 0–800 in steps of 10.
 *
 * `max` doubles as «800+». The design labels the top of the slider that way,
 * and it means «no upper limit» — a request pinned to the maximum must not
 * quietly hide every dish above it.
 */
export const RECIPE_CALORIE_FILTER = Object.freeze({
    min: 0,
    max: 800,
    step: 10,
});

/** A macro is grams per 100 g, so it cannot exceed 100. */
export const PRODUCT_MACRO_MAX_PER_100G = 100;

/** Pure fat is about 900 kcal per 100 g; nothing edible goes higher. */
export const PRODUCT_CALORIES_MAX_PER_100G = 900;

export const PRODUCT_NAME_MAX_LENGTH = 120;
export const PRODUCT_SERVING_LABEL_MAX_LENGTH = 40;
