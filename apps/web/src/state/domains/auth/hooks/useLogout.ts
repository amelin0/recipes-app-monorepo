'use client'

import { useRouter } from 'next/navigation'

import { AuthApi } from '@/data'
import { HttpService } from '@/shared/services'
import { resetStore } from '@/state/store'

export const useLogout = () => {
  const router = useRouter()

  const logout = async () => {
    const refreshToken = HttpService.getRefreshToken()

    // Tell the server first, then forget locally. Clearing the browser alone
    // is cosmetic: the tokens stay valid for anyone who copied them, which is
    // exactly the case «log out» on a shared laptop is meant to cover.
    //
    // Best effort — a network failure must not trap someone in the panel, and
    // the route answers 204 whether or not the token was still good.
    if (refreshToken) {
      await AuthApi.logout(refreshToken).catch(() => undefined)
    }

    HttpService.clearTokens()
    resetStore()
    router.push('/login')
  }

  return { logout }
}
