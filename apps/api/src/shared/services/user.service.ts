import { supabaseAdmin } from '../supabase.ts'

interface UserFilters {
  search?: string
  gender?: string
  country?: string
  language?: string
  page?: number
  limit?: number
}

export const UserService = {
  getMe: async (userId: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  getAll: async () => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getAllPaginated: async (filters: UserFilters) => {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'USER')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    if (filters.gender) query = query.eq('gender', filters.gender)
    if (filters.country) query = query.eq('country', filters.country)
    if (filters.language) query = query.eq('language', filters.language)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], total: count ?? 0, page, limit }
  },

  getById: async (userId: string) => {
    const [profileRes, goalRes, weightRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('nutrition_goals').select('daily_calories, daily_proteins_g, daily_carbs_g, daily_fats_g, is_auto_calculated').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('weight_history').select('weight_kg, recorded_at').eq('user_id', userId).order('recorded_at', { ascending: true }),
    ])

    if (profileRes.error) throw profileRes.error

    return {
      ...profileRes.data,
      nutrition_goal: goalRes.data || null,
      weight_history: weightRes.data || [],
    }
  },

  toggleBlock: async (userId: string, isBlocked: boolean) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_blocked: isBlocked })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateLanguage: async (userId: string, language: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ language })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateMetricSystem: async (userId: string, metricSystem: string) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ metric_system: metricSystem })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  updateWeight: async (userId: string, weightKg: number) => {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ weight_kg: weightKg })
      .eq('id', userId)
      .select()
      .single()
    if (profileError) throw profileError

    const today = new Date().toISOString().split('T')[0]
    const { error: historyError } = await supabaseAdmin
      .from('weight_history')
      .upsert(
        { user_id: userId, weight_kg: weightKg, recorded_at: today },
        { onConflict: 'user_id,recorded_at' },
      )
    if (historyError) throw historyError

    return profile
  },

  getRegistrationStats: async (days: number) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('created_at, language, country')
      .eq('role', 'USER')
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: true })
    if (error) throw error

    const byDate: Record<string, number> = {}
    const byLanguage: Record<string, number> = {}
    const byCountry: Record<string, number> = {}

    for (const row of data || []) {
      const date = row.created_at.split('T')[0]
      byDate[date] = (byDate[date] || 0) + 1

      const lang = row.language || 'unknown'
      byLanguage[lang] = (byLanguage[lang] || 0) + 1

      const country = row.country || 'unknown'
      byCountry[country] = (byCountry[country] || 0) + 1
    }

    return {
      total: (data || []).length,
      by_date: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      by_language: Object.entries(byLanguage).map(([language, count]) => ({ language, count })),
      by_country: Object.entries(byCountry).map(([country, count]) => ({ country, count })),
    }
  },

  getWeightHistory: async (userId: string) => {
    const { data, error } = await supabaseAdmin
      .from('weight_history')
      .select('weight_kg, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true })
    if (error) throw error
    return data
  },
}
