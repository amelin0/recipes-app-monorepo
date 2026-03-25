"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useStore } from "@/state/store"

const PUBLIC_ROUTES = ["/login"]

export function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  useEffect(() => {
    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login")
    }
    if (isAuthenticated && isPublicRoute) {
      router.replace("/")
    }
  }, [isAuthenticated, isPublicRoute, router])

  // Don't render protected content until auth check
  if (!isAuthenticated && !isPublicRoute) return null
  if (isAuthenticated && isPublicRoute) return null

  return <>{children}</>
}
