import { supabaseAdmin } from '../supabase.ts'

interface RecipeTranslation {
  language: string
  title: string
  cooking_instructions: string[]
}

interface RecipeIngredientInput {
  ingredient_id: string
  amount: number
  unit: string
}

interface CreateRecipeParams {
  photo_url?: string
  calories: number
  proteins_g: number
  carbs_g: number
  fats_g: number
  servings?: number
  translations: RecipeTranslation[]
  ingredients: RecipeIngredientInput[]
  tag_ids: string[]
}

interface UpdateRecipeParams {
  photo_url?: string
  calories?: number
  proteins_g?: number
  carbs_g?: number
  fats_g?: number
  servings?: number
  translations?: RecipeTranslation[]
  ingredients?: RecipeIngredientInput[]
  tag_ids?: string[]
}

interface RecipeFilters {
  search?: string
  tags?: string[]
  min_proteins_g?: number
  min_carbs_g?: number
  min_fats_g?: number
  min_calories?: number
  max_calories?: number
  page?: number
  limit?: number
}

export const RecipeService = {
  create: async (userId: string, params: CreateRecipeParams) => {
    const { translations, ingredients, tag_ids, ...recipeData } = params

    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert({ ...recipeData, created_by: userId })
      .select()
      .single()
    if (recipeError) throw recipeError

    // Insert translations
    if (translations.length > 0) {
      const { error } = await supabaseAdmin
        .from('recipe_translations')
        .insert(translations.map((t) => ({ recipe_id: recipe.id, ...t })))
      if (error) throw error
    }

    // Insert ingredients
    if (ingredients.length > 0) {
      const { error } = await supabaseAdmin
        .from('recipe_ingredients')
        .insert(ingredients.map((i) => ({ recipe_id: recipe.id, ...i })))
      if (error) throw error
    }

    // Insert tags
    if (tag_ids.length > 0) {
      const { error } = await supabaseAdmin
        .from('recipe_tags')
        .insert(tag_ids.map((tag_id) => ({ recipe_id: recipe.id, tag_id })))
      if (error) throw error
    }

    return RecipeService.getById(recipe.id, 'uk')
  },

  update: async (recipeId: string, params: UpdateRecipeParams) => {
    const { translations, ingredients, tag_ids, ...recipeData } = params

    if (Object.keys(recipeData).length > 0) {
      const { error } = await supabaseAdmin.from('recipes').update(recipeData).eq('id', recipeId)
      if (error) throw error
    }

    if (translations !== undefined) {
      await supabaseAdmin.from('recipe_translations').delete().eq('recipe_id', recipeId)
      if (translations.length > 0) {
        const { error } = await supabaseAdmin
          .from('recipe_translations')
          .insert(translations.map((t) => ({ recipe_id: recipeId, ...t })))
        if (error) throw error
      }
    }

    if (ingredients !== undefined) {
      await supabaseAdmin.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
      if (ingredients.length > 0) {
        const { error } = await supabaseAdmin
          .from('recipe_ingredients')
          .insert(ingredients.map((i) => ({ recipe_id: recipeId, ...i })))
        if (error) throw error
      }
    }

    if (tag_ids !== undefined) {
      await supabaseAdmin.from('recipe_tags').delete().eq('recipe_id', recipeId)
      if (tag_ids.length > 0) {
        const { error } = await supabaseAdmin
          .from('recipe_tags')
          .insert(tag_ids.map((tag_id) => ({ recipe_id: recipeId, tag_id })))
        if (error) throw error
      }
    }

    return RecipeService.getById(recipeId, 'uk')
  },

  getById: async (id: string, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_translations!inner(title, cooking_instructions),
        recipe_ingredients(amount, unit, ingredients!inner(id, ingredient_translations!inner(name))),
        recipe_tags(tags!inner(id, tag_translations!inner(name)))
      `)
      .eq('id', id)
      .eq('recipe_translations.language', language)
      .eq('recipe_ingredients.ingredients.ingredient_translations.language', language)
      .eq('recipe_tags.tags.tag_translations.language', language)
      .single()
    if (error) throw error
    return formatRecipe(data)
  },

  getAll: async (filters: RecipeFilters, language: string) => {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_translations!inner(title, cooking_instructions),
        recipe_ingredients(amount, unit, ingredients!inner(id, ingredient_translations!inner(name))),
        recipe_tags(tags!inner(id, tag_translations!inner(name)))
      `, { count: 'exact' })
      .eq('recipe_translations.language', language)
      .eq('recipe_ingredients.ingredients.ingredient_translations.language', language)
      .eq('recipe_tags.tags.tag_translations.language', language)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.search) {
      query = query.ilike('recipe_translations.title', `%${filters.search}%`)
    }
    if (filters.min_proteins_g != null) query = query.gte('proteins_g', filters.min_proteins_g)
    if (filters.min_carbs_g != null) query = query.gte('carbs_g', filters.min_carbs_g)
    if (filters.min_fats_g != null) query = query.gte('fats_g', filters.min_fats_g)
    if (filters.min_calories != null) query = query.gte('calories', filters.min_calories)
    if (filters.max_calories != null) query = query.lte('calories', filters.max_calories)

    const { data, error, count } = await query
    if (error) throw error

    let recipes = (data || []).map(formatRecipe)

    // Filter by tag names (post-query)
    if (filters.tags && filters.tags.length > 0) {
      recipes = recipes.filter((r: any) =>
        filters.tags!.every((tagName) =>
          r.tags.some((t: any) => t.name.toLowerCase() === tagName.toLowerCase()),
        ),
      )
    }

    return { data: recipes, total: count, page, limit }
  },

  // Tags
  getAllTags: async (language: string) => {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('id, tag_translations!inner(name)')
      .eq('tag_translations.language', language)
      .order('created_at')
    if (error) throw error
    return (data || []).map((t: any) => ({
      id: t.id,
      name: t.tag_translations[0]?.name ?? '',
    }))
  },

  createTag: async (translations: { language: string; name: string }[]) => {
    const { data: tag, error: tagError } = await supabaseAdmin
      .from('tags')
      .insert({})
      .select()
      .single()
    if (tagError) throw tagError

    const { error } = await supabaseAdmin
      .from('tag_translations')
      .insert(translations.map((t) => ({ tag_id: tag.id, ...t })))
    if (error) throw error

    return tag
  },

  // Ingredients
  getAllIngredients: async (language: string) => {
    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .select('id, ingredient_translations!inner(name)')
      .eq('ingredient_translations.language', language)
      .order('created_at')
    if (error) throw error
    return (data || []).map((i: any) => ({
      id: i.id,
      name: i.ingredient_translations[0]?.name ?? '',
    }))
  },

  createIngredient: async (translations: { language: string; name: string }[]) => {
    const { data: ingredient, error: ingError } = await supabaseAdmin
      .from('ingredients')
      .insert({})
      .select()
      .single()
    if (ingError) throw ingError

    const { error } = await supabaseAdmin
      .from('ingredient_translations')
      .insert(translations.map((t) => ({ ingredient_id: ingredient.id, ...t })))
    if (error) throw error

    return ingredient
  },

  importBatch: async (userId: string, rows: any[]) => {
    // Group by recipe_key
    const groups: Record<string, any[]> = {}
    for (const row of rows) {
      const key = row.recipe_key
      if (!key) continue
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    }

    const imported: string[] = []
    const errors: { recipe_key: string; error: string }[] = []

    for (const [recipeKey, recipeRows] of Object.entries(groups)) {
      try {
        const first = recipeRows[0]

        // Create recipe with numeric data
        const { data: recipe, error: recipeError } = await supabaseAdmin
          .from('recipes')
          .insert({
            calories: Number(first.calories) || 0,
            proteins_g: Number(first.proteins_g) || 0,
            carbs_g: Number(first.carbs_g) || 0,
            fats_g: Number(first.fats_g) || 0,
            servings: Number(first.servings) || 1,
            cooking_time_minutes: Number(first.cooking_time_minutes) || 0,
            created_by: userId,
          })
          .select()
          .single()
        if (recipeError) throw recipeError

        // Insert translations for each language row
        const translations = recipeRows.map((row: any) => ({
          recipe_id: recipe.id,
          language: row.language,
          title: row.title,
          cooking_instructions: row.cooking_instructions ? row.cooking_instructions.split('|').map((s: string) => s.trim()) : [],
        }))
        const { error: transError } = await supabaseAdmin.from('recipe_translations').insert(translations)
        if (transError) throw transError

        // Parse and find/create ingredients (from first row with ingredients)
        const ingredientRows = recipeRows.filter((r: any) => r.ingredients)
        if (ingredientRows.length > 0) {
          // Use first language's ingredients for amounts, create translations from all
          const firstIngRow = ingredientRows[0]
          const ingParts = firstIngRow.ingredients.split(';').map((s: string) => s.trim()).filter(Boolean)

          for (let i = 0; i < ingParts.length; i++) {
            const [name, amountStr, unit] = ingParts[i].split(':')
            if (!name) continue

            // Collect translations for this ingredient index across all languages
            const ingTranslations: { language: string; name: string }[] = []
            for (const row of ingredientRows) {
              const rowParts = row.ingredients.split(';').map((s: string) => s.trim()).filter(Boolean)
              if (rowParts[i]) {
                const [ingName] = rowParts[i].split(':')
                if (ingName) ingTranslations.push({ language: row.language, name: ingName.trim() })
              }
            }

            // Find existing ingredient by name in first language
            const { data: existing } = await supabaseAdmin
              .from('ingredient_translations')
              .select('ingredient_id')
              .eq('name', name.trim())
              .eq('language', firstIngRow.language)
              .limit(1)

            let ingredientId: string
            if (existing && existing.length > 0) {
              ingredientId = existing[0].ingredient_id
              // Add missing translations
              for (const t of ingTranslations) {
                await supabaseAdmin.from('ingredient_translations').upsert(
                  { ingredient_id: ingredientId, language: t.language, name: t.name },
                  { onConflict: 'ingredient_id,language' },
                )
              }
            } else {
              const { data: newIng, error: ingErr } = await supabaseAdmin
                .from('ingredients').insert({}).select().single()
              if (ingErr) throw ingErr
              ingredientId = newIng.id
              await supabaseAdmin.from('ingredient_translations').insert(
                ingTranslations.map((t) => ({ ingredient_id: ingredientId, ...t })),
              )
            }

            await supabaseAdmin.from('recipe_ingredients').insert({
              recipe_id: recipe.id,
              ingredient_id: ingredientId,
              amount: Number(amountStr) || 0,
              unit: unit?.trim() || 'g',
            })
          }
        }

        // Parse and find/create tags
        const tagRows = recipeRows.filter((r: any) => r.tags)
        if (tagRows.length > 0) {
          const firstTagRow = tagRows[0]
          const tagNames = firstTagRow.tags.split(';').map((s: string) => s.trim()).filter(Boolean)

          for (let i = 0; i < tagNames.length; i++) {
            const tagName = tagNames[i]

            // Collect translations for this tag index
            const tagTranslations: { language: string; name: string }[] = []
            for (const row of tagRows) {
              const rowTags = row.tags.split(';').map((s: string) => s.trim()).filter(Boolean)
              if (rowTags[i]) tagTranslations.push({ language: row.language, name: rowTags[i] })
            }

            // Find existing tag
            const { data: existingTag } = await supabaseAdmin
              .from('tag_translations')
              .select('tag_id')
              .eq('name', tagName)
              .eq('language', firstTagRow.language)
              .limit(1)

            let tagId: string
            if (existingTag && existingTag.length > 0) {
              tagId = existingTag[0].tag_id
              for (const t of tagTranslations) {
                await supabaseAdmin.from('tag_translations').upsert(
                  { tag_id: tagId, language: t.language, name: t.name },
                  { onConflict: 'tag_id,language' },
                )
              }
            } else {
              const { data: newTag, error: tagErr } = await supabaseAdmin
                .from('tags').insert({}).select().single()
              if (tagErr) throw tagErr
              tagId = newTag.id
              await supabaseAdmin.from('tag_translations').insert(
                tagTranslations.map((t) => ({ tag_id: tagId, ...t })),
              )
            }

            await supabaseAdmin.from('recipe_tags').insert({
              recipe_id: recipe.id,
              tag_id: tagId,
            }).then(() => {}) // ignore duplicate
          }
        }

        imported.push(recipeKey)
      } catch (e: unknown) {
        errors.push({ recipe_key: recipeKey, error: e instanceof Error ? e.message : 'Unknown error' })
      }
    }

    return { imported: imported.length, errors }
  },

  getByIdAllTranslations: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('recipes')
      .select(`
        *,
        recipe_translations(language, title, cooking_instructions),
        recipe_ingredients(amount, unit, ingredient_id, ingredients!inner(id, ingredient_translations(language, name))),
        recipe_tags(tag_id, tags!inner(id, tag_translations(language, name)))
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
}

// Flatten nested translation structure into clean response
function formatRecipe(raw: any) {
  const translation = raw.recipe_translations?.[0] || {}
  return {
    id: raw.id,
    photo_url: raw.photo_url,
    title: translation.title ?? '',
    calories: raw.calories,
    proteins_g: raw.proteins_g,
    carbs_g: raw.carbs_g,
    fats_g: raw.fats_g,
    servings: raw.servings,
    cooking_time_minutes: raw.cooking_time_minutes,
    cooking_instructions: translation.cooking_instructions ?? [],
    ingredients: (raw.recipe_ingredients || []).map((ri: any) => ({
      id: ri.ingredients?.id,
      name: ri.ingredients?.ingredient_translations?.[0]?.name ?? '',
      amount: ri.amount,
      unit: ri.unit,
    })),
    tags: (raw.recipe_tags || []).map((rt: any) => ({
      id: rt.tags?.id,
      name: rt.tags?.tag_translations?.[0]?.name ?? '',
    })),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}
