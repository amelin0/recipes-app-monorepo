import type { Context, Next } from 'hono'
import { supabaseAdmin } from '../supabase.ts'

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401)

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return c.json({ success: false, error: 'Unauthorized' }, 401)

  // Fetch profile in one query (language + role)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, language')
    .eq('id', user.id)
    .single()

  c.set('userId', user.id)
  c.set('user', user)
  c.set('language', profile?.language ?? 'uk')
  c.set('role', profile?.role ?? 'USER')
  await next()
}

export const adminMiddleware = async (c: Context, next: Next) => {
  const role = c.get('role')

  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  await next()
}

export const superAdminMiddleware = async (c: Context, next: Next) => {
  const role = c.get('role')

  if (role !== 'SUPER_ADMIN') {
    return c.json({ success: false, error: 'Forbidden: SUPER_ADMIN only' }, 403)
  }

  await next()
}
