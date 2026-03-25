'use client'

import { useRouter } from 'next/navigation'
import { HttpService } from '@/shared/services'
import { resetStore } from '@/state/store'

export const useLogout = () => {
  const router = useRouter()

  const logout = () => {
    HttpService.clearTokens()
    resetStore()
    router.push('/login')
  }

  return { logout }
}
