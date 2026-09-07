'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useStore } from '@/state/store'

/**
 * Renders nothing until the persisted store has hydrated, then either the page
 * or a redirect to the login screen.
 *
 * The hydration flag comes from `useSyncExternalStore` rather than a
 * `useState` + `useEffect` pair: the pair sets state synchronously inside an
 * effect, which React flags as a cascading render, and it is the textbook case
 * this hook exists for — the server and the client genuinely disagree about
 * whether `localStorage` has been read yet.
 */
const subscribe = () => () => undefined
const getSnapshot = () => true
const getServerSnapshot = () => false

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const router = useRouter()
  const hydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login')
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated || !isAuthenticated) return null

  return <>{children}</>
}
