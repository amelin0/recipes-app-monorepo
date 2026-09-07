import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A pathname without its trailing slash, for comparing against route
 * constants.
 *
 * The panel is built with `trailingSlash: true`, so `usePathname()` returns
 * `/recipes/` while every href in the code says `/recipes`. Comparing them raw
 * silently never matches — which cost a permanently blank login page once
 * already, and would have left every sidebar item unhighlighted.
 */
export const normalisePath = (pathname: string): string => pathname.replace(/\/+$/, '') || '/'
