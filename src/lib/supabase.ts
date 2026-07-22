import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Whether a Supabase backend is configured. When false (env vars blank), the
 * data layer falls back to localStorage so the app stays runnable before keys
 * are pasted in.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Single Supabase client for the app. When not configured we still create a
 * client against a placeholder URL so the import doesn't throw at module load;
 * `storage.ts` guards every call behind `isSupabaseConfigured` and never uses
 * this client in fallback mode.
 */
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
