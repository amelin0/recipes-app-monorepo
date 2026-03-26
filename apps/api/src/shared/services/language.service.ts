import { supabaseAdmin } from '../supabase.ts'

export const LanguageService = {
  getAll: async (activeOnly = true) => {
    let query = supabaseAdmin
      .from('languages')
      .select('*')
      .order('tier')
      .order('name')

    if (activeOnly) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error
    return data
  },
}
