export interface LoginRequest {
  email: string
  password: string
}

export type AdminRole = 'admin' | 'super_admin'

/** Who is signed in. Renamed from `user`: an admin is a separate account from
 * an app user, in a separate table, and calling both «user» is how the two get
 * confused (ADR-0003). */
export interface AdminProfile {
  id: string
  email: string
  fullName: string
  role: AdminRole
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  admin: AdminProfile
}
