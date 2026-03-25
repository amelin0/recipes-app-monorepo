import { supabaseAdmin } from '../supabase.ts'

export const FavoritesService = {
  add: async (userId: string, recipeId: string) => {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert({ user_id: userId, recipe_id: recipeId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  remove: async (userId: string, recipeId: string) => {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
    if (error) throw error
  },

  getByUser: async (userId: string, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select(`
        id, created_at,
        recipes!inner(
          id, photo_url, calories, proteins_g, carbs_g, fats_g, servings, cooking_time_minutes, favorites_count,
          recipe_translations!inner(title)
        )
      `)
      .eq('user_id', userId)
      .eq('recipes.recipe_translations.language', language)
      .order('created_at', { ascending: false })
    if (error) throw error

    return (data || []).map((f: any) => ({
      id: f.id,
      added_at: f.created_at,
      recipe: {
        id: f.recipes.id,
        title: f.recipes.recipe_translations?.[0]?.title ?? '',
        photo_url: f.recipes.photo_url,
        calories: f.recipes.calories,
        proteins_g: f.recipes.proteins_g,
        carbs_g: f.recipes.carbs_g,
        fats_g: f.recipes.fats_g,
        cooking_time_minutes: f.recipes.cooking_time_minutes,
        favorites_count: f.recipes.favorites_count,
      },
    }))
  },

  // Admin: top favorited recipes with user demographics
  getTopFavorited: async (limit: number, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        id, photo_url, calories, proteins_g, carbs_g, fats_g, favorites_count,
        recipe_translations!inner(title)
      `)
      .eq('recipe_translations.language', language)
      .gt('favorites_count', 0)
      .order('favorites_count', { ascending: false })
      .limit(limit)
    if (error) throw error

    const recipes = (data || []).map((r: any) => ({
      id: r.id,
      title: r.recipe_translations?.[0]?.title ?? '',
      photo_url: r.photo_url,
      calories: r.calories,
      favorites_count: r.favorites_count,
    }))

    // Get demographics for these recipes
    const recipeIds = recipes.map((r: any) => r.id)
    if (recipeIds.length === 0) return []

    const { data: favData, error: favError } = await supabaseAdmin
      .from('favorites')
      .select('recipe_id, profiles!inner(language, country)')
      .in('recipe_id', recipeIds)
    if (favError) throw favError

    // Group demographics per recipe
    const demoMap: Record<string, { by_language: Record<string, number>; by_country: Record<string, number> }> = {}
    for (const f of favData || []) {
      const rid = f.recipe_id
      if (!demoMap[rid]) demoMap[rid] = { by_language: {}, by_country: {} }
      const lang = (f as any).profiles?.language || 'unknown'
      const country = (f as any).profiles?.country || 'unknown'
      demoMap[rid].by_language[lang] = (demoMap[rid].by_language[lang] || 0) + 1
      demoMap[rid].by_country[country] = (demoMap[rid].by_country[country] || 0) + 1
    }

    return recipes.map((r: any) => ({
      ...r,
      demographics: demoMap[r.id] ? {
        by_language: Object.entries(demoMap[r.id].by_language).map(([language, count]) => ({ language, count })),
        by_country: Object.entries(demoMap[r.id].by_country).map(([country, count]) => ({ country, count })),
      } : { by_language: [], by_country: [] },
    }))
  },

  // Admin: full stats for all recipes (paginated)
  getAllStats: async (page: number, limit: number, language: string) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('recipes')
      .select(`
        id, photo_url, calories, favorites_count,
        recipe_translations!inner(title)
      `, { count: 'exact' })
      .eq('recipe_translations.language', language)
      .gt('favorites_count', 0)
      .order('favorites_count', { ascending: false })
      .range(from, to)
    if (error) throw error

    const recipeIds = (data || []).map((r: any) => r.id)

    // Get all favorites with user info for these recipes
    let favUsers: any[] = []
    if (recipeIds.length > 0) {
      const { data: fd, error: fe } = await supabaseAdmin
        .from('favorites')
        .select('recipe_id, created_at, profiles!inner(id, first_name, last_name, email, language, country)')
        .in('recipe_id', recipeIds)
        .order('created_at', { ascending: false })
      if (fe) throw fe
      favUsers = fd || []
    }

    const usersByRecipe: Record<string, any[]> = {}
    const demoByRecipe: Record<string, { by_language: Record<string, number>; by_country: Record<string, number> }> = {}

    for (const f of favUsers) {
      const rid = f.recipe_id
      const profile = (f as any).profiles
      if (!usersByRecipe[rid]) usersByRecipe[rid] = []
      usersByRecipe[rid].push({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        language: profile.language,
        country: profile.country,
        added_at: f.created_at,
      })
      if (!demoByRecipe[rid]) demoByRecipe[rid] = { by_language: {}, by_country: {} }
      const lang = profile.language || 'unknown'
      const country = profile.country || 'unknown'
      demoByRecipe[rid].by_language[lang] = (demoByRecipe[rid].by_language[lang] || 0) + 1
      demoByRecipe[rid].by_country[country] = (demoByRecipe[rid].by_country[country] || 0) + 1
    }

    const recipes = (data || []).map((r: any) => ({
      id: r.id,
      title: r.recipe_translations?.[0]?.title ?? '',
      photo_url: r.photo_url,
      calories: r.calories,
      favorites_count: r.favorites_count,
      users: usersByRecipe[r.id] || [],
      demographics: demoByRecipe[r.id] ? {
        by_language: Object.entries(demoByRecipe[r.id].by_language).map(([language, count]) => ({ language, count })),
        by_country: Object.entries(demoByRecipe[r.id].by_country).map(([country, count]) => ({ country, count })),
      } : { by_language: [], by_country: [] },
    }))

    return { data: recipes, total: count ?? 0, page, limit }
  },
}
