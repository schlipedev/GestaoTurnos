import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

function createMissingSupabaseClient(): SupabaseClient {
  const errorMessage =
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."

  const makeResult = () => ({ data: null, error: { message: errorMessage } })

  const queryBuilder = {
    select: () => ({
      order: async () => makeResult(),
      gte: async () => makeResult(),
      lte: async () => makeResult(),
      eq: async () => makeResult(),
    }),
    insert: async () => makeResult(),
    update: () => ({ eq: async () => makeResult() }),
    delete: () => ({ eq: async () => makeResult() }),
  }

  return {
    from: () => queryBuilder,
  } as unknown as SupabaseClient
}

// Singleton browser client for this single-user, no-auth app.
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = hasSupabaseConfig
      ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
        })
      : createMissingSupabaseClient()
  }
  return client
}

export const supabase = getSupabase()
