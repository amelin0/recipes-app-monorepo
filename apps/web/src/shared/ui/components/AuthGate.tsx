'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useStore } from '@/state/store'
import { normalisePath } from '@/shared/utils/utils'

const PUBLIC_ROUTES = ['/login']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const pathname = usePathname()
  const router = useRouter()

  // Normalised, because `trailingSlash: true` makes this `/login/` while the
  // list says `/login`. A raw compare put the login page into the
  // «not authenticated, not public» branch: it rendered null and redirected to
  // itself — a permanently blank page with nothing in the console, because as
  // far as React was concerned nothing had gone wrong.
  const isPublicRoute = PUBLIC_ROUTES.includes(normalisePath(pathname))

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
    }
    if (isAuthenticated && isPublicRoute) {
      router.replace('/')
    }
  }, [isAuthenticated, isPublicRoute, router])

  // Don't render protected content before the redirect has had its chance.
  if (!isAuthenticated && !isPublicRoute) return null
  if (isAuthenticated && isPublicRoute) return null

  return <>{children}</>
}
