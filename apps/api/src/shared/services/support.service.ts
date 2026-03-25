import { supabaseAdmin } from '../supabase.ts'
import { NotificationService } from './notification.service.ts'

interface CreateSupportMessageParams {
  title: string
  description: string
  photo_url?: string
}

export const SupportService = {
  create: async (userId: string, params: CreateSupportMessageParams) => {
    const { data: message, error } = await supabaseAdmin
      .from('support_messages')
      .insert({ user_id: userId, ...params })
      .select()
      .single()
    if (error) throw error

    // Get user info for notification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single()

    // Create notification for admin
    await NotificationService.create({
      type: 'SUPPORT_MESSAGE',
      title: `New support message: ${params.title}`,
      body: `From ${profile?.first_name ?? ''} ${profile?.last_name ?? ''} (${profile?.email ?? ''})`,
      metadata: {
        support_message_id: message.id,
        user_id: userId,
        user_name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`,
        user_email: profile?.email ?? '',
        message_title: params.title,
      },
    })

    return message
  },

  getAll: async (page: number, limit: number) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabaseAdmin
      .from('support_messages')
      .select('*, profiles!inner(first_name, last_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw error

    const messages = (data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      photo_url: m.photo_url,
      status: m.status,
      created_at: m.created_at,
      user: {
        id: m.user_id,
        first_name: m.profiles.first_name,
        last_name: m.profiles.last_name,
        email: m.profiles.email,
      },
    }))

    return { data: messages, total: count ?? 0, page, limit }
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*, profiles!inner(first_name, last_name, email)')
      .eq('id', id)
      .single()
    if (error) throw error

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      photo_url: data.photo_url,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: {
        id: data.user_id,
        first_name: (data as any).profiles.first_name,
        last_name: (data as any).profiles.last_name,
        email: (data as any).profiles.email,
      },
    }
  },

  updateStatus: async (id: string, status: string) => {
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
