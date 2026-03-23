import { supabaseAdmin } from '../supabase.ts'

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
    // Update current weight on profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ weight_kg: weightKg })
      .eq('id', userId)
      .select()
      .single()
    if (profileError) throw profileError

    // Upsert to weight history (one entry per day)
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
