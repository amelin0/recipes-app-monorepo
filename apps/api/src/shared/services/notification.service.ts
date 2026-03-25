import { supabaseAdmin } from '../supabase.ts'

interface CreateNotificationParams {
  type: string
  title: string
  body?: string
  metadata?: Record<string, unknown>
}

export const NotificationService = {
  create: async (params: CreateNotificationParams) => {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(params)
      .select()
      .single()
    if (error) throw error
    return data
  },

  getAll: async (page: number, limit: number) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const [listRes, unreadRes] = await Promise.all([
      supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to),
      supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false),
    ])

    if (listRes.error) throw listRes.error

    return {
      data: listRes.data || [],
      total: listRes.count ?? 0,
      unread_count: unreadRes.count ?? 0,
      page,
      limit,
    }
  },

  getUnreadCount: async () => {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
    if (error) throw error
    return count ?? 0
  },

  markAllRead: async () => {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    if (error) throw error
  },
}
