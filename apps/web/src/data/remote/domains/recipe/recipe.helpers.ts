import type { RecipeDetail, SaveRecipeParams } from './recipe.types'

/**
 * Turns a loaded dish back into a write body.
 *
 * Needed because the endpoint is a `PUT`: it replaces the composition and the
 * steps wholesale, so «change one field» means «send the whole dish with that
 * field changed». Posting a lone `{ photoUrl }` would empty the ingredient
 * list — which is exactly the bug this exists to prevent.
 *
 * Macros are not carried over: the server derives them from the composition.
 */
export function toSaveParams(recipe: RecipeDetail, changes: Partial<SaveRecipeParams> = {}): SaveRecipeParams {
  return {
    importKey: recipe.importKey,
    categoryId: recipe.categoryId,
    cuisineId: recipe.cuisineId,
    dietIds: recipe.dietIds,
    photoUrl: recipe.photoUrl,
    servings: recipe.servings,
    cookTimeMinutes: recipe.cookTimeMinutes,
    translations: recipe.translations.map(t => ({ language: t.language, title: t.title })),
    ingredients: recipe.ingredients.map(line => ({ productId: line.productId, amountG: line.amountG })),
    steps: recipe.steps.map(step => ({
      stepNumber: step.stepNumber,
      durationMinutes: step.durationMinutes,
      translations: step.translations,
      // Chips reference rows by id when read and by position when written, so
      // the ids have to be resolved back to indexes in the list above.
      ingredientIndexes: step.ingredientIds
        .map(id => recipe.ingredients.findIndex(line => line.id === id))
        .filter(index => index >= 0),
    })),
    ...changes,
  }
}
