import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client singleton.
 * Returns null when env vars are not configured (safe for local dev without backend).
 */
export function createSupabaseClient(): SupabaseClient | null {
	if (!supabaseUrl || !supabaseAnonKey) {
		if (import.meta.env.DEV) {
			console.warn(
				'[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local.',
			)
		}
		return null
	}

	return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()
