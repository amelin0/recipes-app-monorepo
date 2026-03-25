export interface RegistrationStats {
  total: number
  by_date: { date: string; count: number }[]
  by_language: { language: string; count: number }[]
  by_country: { country: string; count: number }[]
}
