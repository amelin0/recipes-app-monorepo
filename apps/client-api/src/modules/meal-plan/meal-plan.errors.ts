export const MealPlanErrorCode = {
    /** The dish being planned does not exist, or belongs to somebody else. */
    RecipeNotFound: 'meal-plan.recipe-not-found',
    ItemNotFound: 'meal-plan.item-not-found',
    /** Copying an empty day would clear every day it was copied onto. */
    NothingToCopy: 'meal-plan.nothing-to-copy',
    SourceAmongTargets: 'meal-plan.source-among-targets',
} as const;
