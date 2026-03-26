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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single()

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
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw error

    // Fetch profiles for all user_ids
    const userIds = [...new Set((data || []).map((m: any) => m.user_id))]
    let profilesMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds)
      for (const p of profiles || []) {
        profilesMap[p.id] = p
      }
    }

    const messages = (data || []).map((m: any) => {
      const profile = profilesMap[m.user_id]
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        photo_url: m.photo_url,
        status: m.status,
        created_at: m.created_at,
        user: {
          id: m.user_id,
          first_name: profile?.first_name ?? '',
          last_name: profile?.last_name ?? '',
          email: profile?.email ?? '',
        },
      }
    })

    return { data: messages, total: count ?? 0, page, limit }
  },

  getById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', data.user_id)
      .single()

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
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        email: profile?.email ?? '',
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
