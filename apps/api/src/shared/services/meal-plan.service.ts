import { supabaseAdmin } from '../supabase.ts'
import { ShoppingListService } from './shopping-list.service.ts'

const DAYS_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

const MEAL_SELECT = `
  id, day_of_week, meal_type, servings,
  recipes!inner(id, calories, proteins_g, carbs_g, fats_g, photo_url, cooking_time_minutes,
    recipe_translations!inner(title))
`

function formatItem(item: any) {
  return {
    id: item.id,
    day_of_week: item.day_of_week,
    meal_type: item.meal_type,
    servings: item.servings,
    recipe: {
      id: item.recipes.id,
      title: item.recipes.recipe_translations?.[0]?.title ?? '',
      photo_url: item.recipes.photo_url,
      calories: item.recipes.calories,
      proteins_g: item.recipes.proteins_g,
      carbs_g: item.recipes.carbs_g,
      fats_g: item.recipes.fats_g,
      cooking_time_minutes: item.recipes.cooking_time_minutes,
    },
  }
}

function groupByDay(items: any[]) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const meals = ['breakfast', 'lunch', 'dinner', 'snack']
  const result: Record<string, Record<string, any[]>> = {}

  for (const day of days) {
    result[day] = {}
    for (const meal of meals) {
      result[day][meal] = []
    }
  }

  for (const item of items) {
    result[item.day_of_week][item.meal_type].push(item)
  }

  return result
}

export const MealPlanService = {
  getWeek: async (userId: string, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_items')
      .select(MEAL_SELECT)
      .eq('user_id', userId)
      .eq('recipes.recipe_translations.language', language)
      .order('created_at')
    if (error) throw error

    return groupByDay((data || []).map(formatItem))
  },

  getDay: async (userId: string, day: string, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_items')
      .select(MEAL_SELECT)
      .eq('user_id', userId)
      .eq('day_of_week', day)
      .eq('recipes.recipe_translations.language', language)
      .order('created_at')
    if (error) throw error

    const items = (data || []).map(formatItem)
    const grouped: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
    for (const item of items) grouped[item.meal_type].push(item)
    return grouped
  },

  getToday: async (userId: string, language: string) => {
    const today = DAYS_MAP[new Date().getDay()]
    return MealPlanService.getDay(userId, today, language)
  },

  addItem: async (userId: string, dayOfWeek: string, mealType: string, recipeId: string, servings: number) => {
    const { data, error } = await supabaseAdmin
      .from('meal_plan_items')
      .insert({ user_id: userId, day_of_week: dayOfWeek, meal_type: mealType, recipe_id: recipeId, servings })
      .select()
      .single()
    if (error) throw error
    return data
  },

  removeItem: async (userId: string, itemId: string) => {
    const { error } = await supabaseAdmin
      .from('meal_plan_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)
    if (error) throw error
  },

  clearDay: async (userId: string, day: string) => {
    const { error } = await supabaseAdmin
      .from('meal_plan_items')
      .delete()
      .eq('user_id', userId)
      .eq('day_of_week', day)
    if (error) throw error
  },

  copyDay: async (userId: string, fromDay: string, toDay: string) => {
    // Get source day items
    const { data: sourceItems, error: getError } = await supabaseAdmin
      .from('meal_plan_items')
      .select('meal_type, recipe_id, servings')
      .eq('user_id', userId)
      .eq('day_of_week', fromDay)
    if (getError) throw getError
    if (!sourceItems?.length) return

    // Clear target day
    await MealPlanService.clearDay(userId, toDay)

    // Copy items
    const { error } = await supabaseAdmin
      .from('meal_plan_items')
      .insert(sourceItems.map((item) => ({
        user_id: userId,
        day_of_week: toDay,
        meal_type: item.meal_type,
        recipe_id: item.recipe_id,
        servings: item.servings,
      })))
    if (error) throw error
  },

  dayToShoppingList: async (userId: string, day: string) => {
    const { data: items, error } = await supabaseAdmin
      .from('meal_plan_items')
      .select('recipe_id, servings')
      .eq('user_id', userId)
      .eq('day_of_week', day)
    if (error) throw error

    let result
    for (const item of items || []) {
      result = await ShoppingListService.addRecipe(userId, item.recipe_id, item.servings)
    }

    return result || { recipes: [], items: [] }
  },
}
