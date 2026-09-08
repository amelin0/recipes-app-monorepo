export interface DailyCount {
  /** `YYYY-MM-DD`, a UTC day. */
  date: string
  count: number
}

export interface LanguageCount {
  /** Null for accounts that never got settings — counted, not dropped. */
  language: string | null
  count: number
}

/** Everything the home screen shows. One request, because it is one screen. */
export interface Overview {
  registrations: {
    total: number
    /** Every day of the period, zeros included. */
    byDate: DailyCount[]
    byLanguage: LanguageCount[]
  }
  users: {
    total: number
    blocked: number
    withActiveSubscription: number
  }
  catalogue: {
    recipes: number
    /** Archived products excluded, exactly as on the products page. */
    products: number
    unverifiedCustomProducts: number
  }
  /** What is waiting for someone to do something. */
  queues: {
    newTickets: number
    overdueDeletions: number
  }
}

/** How often a dish is kept, and in which languages. Never by whom. */
export interface FavoriteRecipe {
  id: string
  name: string
  photoUrl: string | null
  calories: number
  favorites: number
  byLanguage: LanguageCount[]
}

export type DashboardPeriod = 7 | 30 | 90
