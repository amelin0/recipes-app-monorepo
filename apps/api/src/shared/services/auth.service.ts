import { supabaseAdmin, supabaseAuth } from '../supabase.ts'

interface LoginParams {
  email: string
  password: string
}

interface RegisterParams {
  email: string
  password: string
  first_name: string
  last_name?: string
}

export const AuthService = {
  login: async ({ email, password }: LoginParams) => {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', data.user.id)
      .single()

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        role: profile?.role ?? 'USER',
      },
    }
  },

  register: async ({ email, password, first_name, last_name }: RegisterParams) => {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name: last_name ?? '' },
      },
    })
    if (error) throw error

    return {
      access_token: data.session?.access_token ?? '',
      refresh_token: data.session?.refresh_token ?? '',
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        first_name,
        last_name: last_name ?? '',
        role: 'USER',
      },
    }
  },
}
