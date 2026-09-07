import type { NextConfig } from 'next'

/**
 * The admin panel ships as **static files**, served by nginx off the same box
 * as the API.
 *
 * Nothing here needs a server: every screen is client-rendered, all data comes
 * from the admin API over HTTP, and the session lives in `localStorage`. A
 * Node process to hand back HTML that JavaScript immediately replaces would be
 * one more thing to keep running and restart on deploy.
 *
 * ⚠️ `NEXT_PUBLIC_API_URL` is inlined at **build** time. Changing it means
 * rebuilding, not restarting — there is no process to restart.
 */
const nextConfig: NextConfig = {
  output: 'export',

  // Emits `recipes/index.html` instead of `recipes.html`, so nginx can serve
  // the tree with a plain `try_files $uri $uri/ =404` and no rewrite rules.
  trailingSlash: true,

  // The optimiser is a server feature. Without this the export fails on the
  // first `next/image`; the panel uses plain `<img>` anyway.
  images: { unoptimized: true },
}

export default nextConfig
