export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          language: Database["public"]["Enums"]["app_language"]
          metric_system: Database["public"]["Enums"]["metric_system"]
          gender: Database["public"]["Enums"]["gender"] | null
          weight_kg: number | null
          is_blocked: boolean
          created_at: string
          updated_at: string
        }
      }
      nutrition_goals: {
        Row: {
          id: string
          user_id: string
          daily_calories: number
          daily_proteins_g: number
          daily_carbs_g: number
          daily_fats_g: number
          is_auto_calculated: boolean
          created_at: string
          updated_at: string
        }
      }
      weight_history: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          recorded_at: string
          created_at: string
        }
      }
    }
    Enums: {
      app_language: "uk" | "en" | "ru" | "es"
      gender: "male" | "female" | "other"
      metric_system: "METRIC" | "IMPERIAL"
      user_role: "USER" | "ADMIN" | "SUPER_ADMIN"
    }
  }
}
