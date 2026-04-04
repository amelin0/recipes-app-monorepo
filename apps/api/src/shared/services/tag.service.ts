import { supabaseAdmin } from '../supabase.ts'

export const TagService = {
  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('id, created_at, tag_translations(language, name)')
      .order('created_at')
    if (error) throw error
    return data ?? []
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('id, created_at, tag_translations(language, name)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (translations: { language: string; name: string }[]) => {
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

    return TagService.getById(tag.id)
  },

  update: async (id: string, translations: { language: string; name: string }[]) => {
    // Delete old translations, insert new
    await supabaseAdmin.from('tag_translations').delete().eq('tag_id', id)
    if (translations.length > 0) {
      const { error } = await supabaseAdmin
        .from('tag_translations')
        .insert(translations.map((t) => ({ tag_id: id, ...t })))
      if (error) throw error
    }
    return TagService.getById(id)
  },

  delete: async (id: string) => {
    // recipe_tags FK cascade will remove links
    const { error } = await supabaseAdmin.from('tags').delete().eq('id', id)
    if (error) throw error
    return { deleted: 1 }
  },

  // Assign tags to recipes (additive — does not remove existing tags)
  assignToRecipes: async (recipeIds: string[], tagIds: string[]) => {
    const rows = recipeIds.flatMap((recipeId) =>
      tagIds.map((tagId) => ({ recipe_id: recipeId, tag_id: tagId })),
    )
    // upsert to ignore duplicates
    const { error } = await supabaseAdmin
      .from('recipe_tags')
      .upsert(rows, { onConflict: 'recipe_id,tag_id', ignoreDuplicates: true })
    if (error) throw error
    return { assigned: rows.length }
  },

  // Remove tags from recipes
  removeFromRecipes: async (recipeIds: string[], tagIds: string[]) => {
    const { error } = await supabaseAdmin
      .from('recipe_tags')
      .delete()
      .in('recipe_id', recipeIds)
      .in('tag_id', tagIds)
    if (error) throw error
    return { removed: recipeIds.length * tagIds.length }
  },

  // Get recipe count per tag
  getRecipeCounts: async () => {
    const { data, error } = await supabaseAdmin
      .from('recipe_tags')
      .select('tag_id')
    if (error) throw error

    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.tag_id] = (counts[row.tag_id] || 0) + 1
    }
    return counts
  },
}
