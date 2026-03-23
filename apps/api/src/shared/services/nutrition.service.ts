import { supabaseAdmin } from '../supabase.ts'

interface SetGoalParams {
  daily_calories?: number
  daily_proteins_g: number
  daily_carbs_g: number
  daily_fats_g: number
}

const calculateCalories = (proteins: number, carbs: number, fats: number) =>
  Math.round(proteins * 4 + carbs * 4 + fats * 9)

export const NutritionService = {
  setGoal: async (userId: string, params: SetGoalParams) => {
    const isAuto = !params.daily_calories
    const calories = params.daily_calories || calculateCalories(
      params.daily_proteins_g,
      params.daily_carbs_g,
      params.daily_fats_g,
    )

    const { data, error } = await supabaseAdmin
      .from('nutrition_goals')
      .upsert(
        {
          user_id: userId,
          daily_calories: calories,
          daily_proteins_g: params.daily_proteins_g,
          daily_carbs_g: params.daily_carbs_g,
          daily_fats_g: params.daily_fats_g,
          is_auto_calculated: isAuto,
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single()
    if (error) throw error
    return data
  },

  getGoal: async (userId: string) => {
    const { data, error } = await supabaseAdmin
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  getDaily: async (userId: string, date: string) => {
    const [goal, summary] = await Promise.all([
      NutritionService.getGoal(userId),
      supabaseAdmin
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()
        .then(({ data }) => data),
    ])

    const current = summary || {
      total_calories: 0,
      total_proteins_g: 0,
      total_carbs_g: 0,
      total_fats_g: 0,
    }

    return {
      date,
      goal: goal
        ? {
            daily_calories: goal.daily_calories,
            daily_proteins_g: goal.daily_proteins_g,
            daily_carbs_g: goal.daily_carbs_g,
            daily_fats_g: goal.daily_fats_g,
          }
        : null,
      current: {
        total_calories: current.total_calories,
        total_proteins_g: current.total_proteins_g,
        total_carbs_g: current.total_carbs_g,
        total_fats_g: current.total_fats_g,
      },
    }
  },
}
