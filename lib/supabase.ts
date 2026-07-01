import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

let client: SupabaseClient | null = null

// Singleton browser client for this single-user, no-auth app.
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  }
  return client
}

export const supabase = getSupabase()
