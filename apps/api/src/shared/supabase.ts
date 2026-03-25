import { createClient } from '@supabase/supabase-js'

// Admin client for DB queries — bypasses RLS
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Separate client for auth operations — so signIn doesn't pollute admin session
export const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
