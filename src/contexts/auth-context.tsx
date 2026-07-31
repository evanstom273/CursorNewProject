import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
	user: User | null
	session: Session | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<string | null>
	signUp: (email: string, password: string) => Promise<string | null>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!supabase) {
			setLoading(false)
			return
		}

		supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
			setSession(currentSession)
			setLoading(false)
		})

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession)
			setLoading(false)
		})

		return () => subscription.unsubscribe()
	}, [])

	const signIn = useCallback(async (email: string, password: string) => {
		if (!supabase) return 'Supabase is not configured.'

		const { error } = await supabase.auth.signInWithPassword({ email, password })
		return error?.message ?? null
	}, [])

	const signUp = useCallback(async (email: string, password: string) => {
		if (!supabase) return 'Supabase is not configured.'

		const { error } = await supabase.auth.signUp({ email, password })
		return error?.message ?? null
	}, [])

	const signOut = useCallback(async () => {
		if (!supabase) return
		await supabase.auth.signOut()
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({
			user: session?.user ?? null,
			session,
			loading,
			signIn,
			signUp,
			signOut,
		}),
		[session, loading, signIn, signUp, signOut],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
