import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(url && key && !url.includes('YOUR_PROJECT'))

let client: SupabaseClient | undefined
export function db(): SupabaseClient {
  if (!configured) throw new Error('Supabase is not configured. See README.md.')
  if (!client) client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}
