export interface LoginRequest {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: AuthUser
}
