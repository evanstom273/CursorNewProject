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

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export function getSupabaseConfigError(): string | null {
	if (isSupabaseConfigured) return null

	if (import.meta.env.PROD) {
		return 'Supabase env vars are missing on this deployment. In Vercel → Settings → Environment Variables, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.'
	}

	return 'Supabase env vars are missing locally. Create .env.local from .env.example, add your keys, then restart npm run dev.'
}

declare global {
	interface Window {
		__supabase?: SupabaseClient | null
	}
}

if (import.meta.env.DEV) {
	window.__supabase = supabase

	if (!supabase) {
		console.warn(
			'[supabase] Client not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart npm run dev.',
		)
	} else {
		console.info('[supabase] Dev client ready — use window.__supabase in the console.')
	}
}
