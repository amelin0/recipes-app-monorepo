import type { Context } from 'hono'

export const success = (c: Context, data: unknown, status = 200) => {
  return c.json({ success: true, data }, status as never)
}

export const error = (c: Context, message: string, status = 400) => {
  return c.json({ success: false, error: message }, status as never)
}
