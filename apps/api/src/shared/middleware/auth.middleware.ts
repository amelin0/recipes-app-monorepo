import type { Context, Next } from 'hono'
import { supabaseAdmin } from '../supabase.ts'

export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401)

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return c.json({ success: false, error: 'Unauthorized' }, 401)

  c.set('userId', user.id)
  c.set('user', user)
  await next()
}

export const adminMiddleware = async (c: Context, next: Next) => {
  const userId = c.get('userId')

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  c.set('role', profile.role)
  await next()
}
