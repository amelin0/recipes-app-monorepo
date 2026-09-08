/** A row of the user directory. */
export interface User {
  id: string
  email: string
  /** Null until the questionnaire is started — a normal state, not missing data. */
  name: string | null
  language: string | null
  isEmailVerified: boolean
  /** Set means staff stopped the account. */
  blockedAt: string | null
  hasActiveSubscription: boolean
  /** When the account is due to be erased, if the owner asked for it. */
  deletionScheduledFor: string | null
  createdAt: string
}

export interface UserSubscription {
  status: string
  planSlug: string
  source: string
  startedAt: string
  expiresAt: string
}

export interface UserActivity {
  ownRecipes: number
  favorites: number
  /** Last session issued or refreshed — not the last API call. */
  lastSeenAt: string | null
}

export interface UserDeletionRequest {
  scheduledFor: string
  requestedAt: string
  /** The grace period has passed and nothing has run — see ADR-0005. */
  isOverdue: boolean
}

/**
 * The card behind a row.
 *
 * No questionnaire: gender, weight, height, goal and daily targets are
 * medically sensitive, and nothing this screen exists for needs them
 * (user-directory FR-004).
 */
export interface UserDetail extends User {
  /** `password`, `apple`, `google` — an account can hold more than one. */
  signInMethods: string[]
  subscription: UserSubscription | null
  activity: UserActivity
  deletionRequest: UserDeletionRequest | null
}

/** `overdue` is the one the panel counts: grace period passed, nothing ran. */
export type DeletionFilter = 'none' | 'active' | 'overdue'

export interface UserFilters {
  search?: string
  isBlocked?: boolean
  isEmailVerified?: boolean
  hasSubscription?: boolean
  deletion?: DeletionFilter
  page?: number
  limit?: number
}
