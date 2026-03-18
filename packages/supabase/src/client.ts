import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'

export function createSupabaseClient(
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions<'public'>
) {
  return createClient(url, anonKey, options)
}