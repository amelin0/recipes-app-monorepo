export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_nutrition_summary: {
        Row: {
          created_at: string
          date: string
          id: string
          total_calories: number
          total_carbs_g: number
          total_fats_g: number
          total_proteins_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          total_calories?: number
          total_carbs_g?: number
          total_fats_g?: number
          total_proteins_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_calories?: number
          total_carbs_g?: number
          total_fats_g?: number
          total_proteins_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_goals: {
        Row: {
          created_at: string
          daily_calories: number
          daily_carbs_g: number
          daily_fats_g: number
          daily_proteins_g: number
          id: string
          is_auto_calculated: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calories: number
          daily_carbs_g: number
          daily_fats_g: number
          daily_proteins_g: number
          id?: string
          is_auto_calculated?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calories?: number
          daily_carbs_g?: number
          daily_fats_g?: number
          daily_proteins_g?: number
          id?: string
          is_auto_calculated?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          language: Database["public"]["Enums"]["app_language"]
          metric_system: Database["public"]["Enums"]["metric_system"]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          language?: Database["public"]["Enums"]["app_language"]
          metric_system?: Database["public"]["Enums"]["metric_system"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          metric_system?: Database["public"]["Enums"]["metric_system"]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_language: "uk" | "en" | "ru" | "es"
      metric_system: "METRIC" | "IMPERIAL"
      user_role: "USER" | "ADMIN" | "SUPER_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][T]["Update"]

export type Enums<
  T extends keyof Database["public"]["Enums"],
> = Database["public"]["Enums"][T]
