import { supabaseAdmin } from '../supabase.ts'

export const ShoppingListService = {
  /**
   * Get or create the user's shopping list
   */
  getOrCreateList: async (userId: string) => {
    const { data } = await supabaseAdmin
      .from('shopping_lists')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (data) return data.id

    const { data: created, error } = await supabaseAdmin
      .from('shopping_lists')
      .insert({ user_id: userId })
      .select('id')
      .single()
    if (error) throw error
    return created.id
  },

  /**
   * Add a recipe to shopping list and recalculate items
   */
  addRecipe: async (userId: string, recipeId: string, servings: number) => {
    const listId = await ShoppingListService.getOrCreateList(userId)

    // Add recipe to list
    const { error: addError } = await supabaseAdmin
      .from('shopping_list_recipes')
      .insert({ shopping_list_id: listId, recipe_id: recipeId, servings })
    if (addError) throw addError

    // Recalculate items
    await ShoppingListService.recalculateItems(listId)

    return ShoppingListService.getList(userId)
  },

  /**
   * Remove a recipe entry from shopping list
   */
  removeRecipe: async (userId: string, shoppingListRecipeId: string) => {
    const listId = await ShoppingListService.getOrCreateList(userId)

    const { error } = await supabaseAdmin
      .from('shopping_list_recipes')
      .delete()
      .eq('id', shoppingListRecipeId)
      .eq('shopping_list_id', listId)
    if (error) throw error

    await ShoppingListService.recalculateItems(listId)

    return ShoppingListService.getList(userId)
  },

  /**
   * Toggle checked state of an item
   */
  toggleItem: async (userId: string, itemId: string) => {
    const listId = await ShoppingListService.getOrCreateList(userId)

    // Get current state
    const { data: item, error: getError } = await supabaseAdmin
      .from('shopping_list_items')
      .select('is_checked')
      .eq('id', itemId)
      .eq('shopping_list_id', listId)
      .single()
    if (getError) throw getError

    const { error } = await supabaseAdmin
      .from('shopping_list_items')
      .update({ is_checked: !item.is_checked })
      .eq('id', itemId)
    if (error) throw error

    return { id: itemId, is_checked: !item.is_checked }
  },

  /**
   * Clear entire shopping list
   */
  clear: async (userId: string) => {
    const listId = await ShoppingListService.getOrCreateList(userId)

    await supabaseAdmin.from('shopping_list_recipes').delete().eq('shopping_list_id', listId)
    await supabaseAdmin.from('shopping_list_items').delete().eq('shopping_list_id', listId)

    return { recipes: [], items: [] }
  },

  /**
   * Get full shopping list with items and recipe sources
   */
  getList: async (userId: string, language = 'uk') => {
    const listId = await ShoppingListService.getOrCreateList(userId)

    const [recipesRes, itemsRes] = await Promise.all([
      supabaseAdmin
        .from('shopping_list_recipes')
        .select('id, servings, recipe_id, recipes!inner(id, recipe_translations!inner(title))')
        .eq('shopping_list_id', listId)
        .eq('recipes.recipe_translations.language', language)
        .order('created_at'),
      supabaseAdmin
        .from('shopping_list_items')
        .select('id, total_amount, unit, is_checked, ingredient_id, ingredients!inner(id, ingredient_translations!inner(name))')
        .eq('shopping_list_id', listId)
        .eq('ingredients.ingredient_translations.language', language)
        .order('is_checked')
    ])

    if (recipesRes.error) throw recipesRes.error
    if (itemsRes.error) throw itemsRes.error

    const recipes = (recipesRes.data || []).map((r: any) => ({
      id: r.id,
      recipe_id: r.recipe_id,
      title: r.recipes?.recipe_translations?.[0]?.title ?? '',
      servings: r.servings,
    }))

    const items = (itemsRes.data || []).map((i: any) => ({
      id: i.id,
      ingredient_id: i.ingredient_id,
      name: i.ingredients?.ingredient_translations?.[0]?.name ?? '',
      total_amount: i.total_amount,
      unit: i.unit,
      is_checked: i.is_checked,
    }))

    return { recipes, items }
  },

  /**
   * Recalculate aggregated items from all recipes in the list
   */
  recalculateItems: async (listId: string) => {
    // Get all recipes with their ingredients
    const { data: listRecipes, error: lrError } = await supabaseAdmin
      .from('shopping_list_recipes')
      .select('servings, recipes!inner(servings, recipe_ingredients(ingredient_id, amount, unit))')
      .eq('shopping_list_id', listId)
    if (lrError) throw lrError

    // Aggregate: key = "ingredient_id:unit"
    const aggregated = new Map<string, { ingredient_id: string; total_amount: number; unit: string }>()

    for (const lr of listRecipes || []) {
      const recipe = lr.recipes as any
      const recipeServings = recipe.servings || 1
      const multiplier = lr.servings / recipeServings

      for (const ri of recipe.recipe_ingredients || []) {
        const key = `${ri.ingredient_id}:${ri.unit}`
        const existing = aggregated.get(key)
        const scaledAmount = ri.amount * multiplier

        if (existing) {
          existing.total_amount += scaledAmount
        } else {
          aggregated.set(key, {
            ingredient_id: ri.ingredient_id,
            total_amount: scaledAmount,
            unit: ri.unit,
          })
        }
      }
    }

    // Preserve checked state
    const { data: existingItems } = await supabaseAdmin
      .from('shopping_list_items')
      .select('ingredient_id, unit, is_checked')
      .eq('shopping_list_id', listId)

    const checkedMap = new Map<string, boolean>()
    for (const item of existingItems || []) {
      checkedMap.set(`${item.ingredient_id}:${item.unit}`, item.is_checked)
    }

    // Replace items
    await supabaseAdmin.from('shopping_list_items').delete().eq('shopping_list_id', listId)

    if (aggregated.size > 0) {
      const items = Array.from(aggregated.values()).map((item) => ({
        shopping_list_id: listId,
        ingredient_id: item.ingredient_id,
        total_amount: Math.round(item.total_amount * 100) / 100,
        unit: item.unit,
        is_checked: checkedMap.get(`${item.ingredient_id}:${item.unit}`) ?? false,
      }))

      const { error } = await supabaseAdmin.from('shopping_list_items').insert(items)
      if (error) throw error
    }
  },
}
