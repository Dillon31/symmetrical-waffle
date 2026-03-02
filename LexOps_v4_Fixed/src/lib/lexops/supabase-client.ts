/**
 * LexOps Supabase Client — Single Source of Truth
 *
 * Import from here (or from @/lib/lexops) — never call createClient elsewhere.
 *
 * Usage:
 *   import { supabase, lexDB } from '@/lib/lexops/supabase-client'
 *   import { mattersApi, dashboardApi }  from '@/lib/lexops'   ← preferred
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[LexOps] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Copy .env.example → .env and fill in your Supabase credentials.'
  )
}

/** Public Supabase client — uses anon key, RLS enforced at all times */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

/**
 * Shorthand for querying the `lex` schema.
 * Equivalent to supabase.schema('lex').from(table)
 */
export function lexDB<T extends string>(table: T) {
  return supabase.schema('lex').from(table)
}

/** Typed Edge Function caller — JWT forwarded automatically */
export async function callEdgeFunction<TPayload, TResponse>(
  slug: string,
  payload: TPayload,
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke<TResponse>(slug, {
    body: payload,
  })
  if (error) throw error
  if (!data) throw new Error(`Edge function "${slug}" returned no data`)
  return data
}

// ── Auth convenience re-exports ──────────────────────────────

export const auth = supabase.auth

/** Returns the full lex.users row for the current session, or null */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await lexDB('users')
    .select('*')
    .eq('id', user.id)
    .single()
  return profile
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}
