import { HttpService } from '@/shared/services'
import type { RegistrationStats } from './dashboard.types'

export const DashboardApi = {
  getRegistrationStats: (days: number) =>
    HttpService.get<RegistrationStats>(`/admin/users/stats?days=${days}`),
}
