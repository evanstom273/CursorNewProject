import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
	isGridInteracting,
	isRemotePaused,
	registerDashboardSaveHandler,
} from '@/lib/dashboard-interaction'
import {
	fetchDashboardRow,
	isDashboardRow,
	saveDashboardRow,
	saveDashboardRowKeepalive,
	type DashboardRow,
} from '@/lib/dashboard-sync-api'
import { supabase } from '@/lib/supabase'
import {
	createDefaultInstances,
	createDefaultLayouts,
	useDashboardStore,
} from '@/stores/dashboard-store'

export function useDashboardSync() {
	const { user } = useAuth()
	const setDashboard = useDashboardStore((s) => s.setDashboard)
	const setHydrated = useDashboardStore((s) => s.setHydrated)

	const [syncError, setSyncError] = useState<string | null>(null)
	const readyRef = useRef(false)
	const savingRef = useRef(false)
	const lastServerUpdatedAtRef = useRef<string | null>(null)
	const pendingSaveUpdatedAtRef = useRef<string | null>(null)

	const applyRemoteRow = useCallback(
		(row: DashboardRow) => {
			if (isRemotePaused() || isGridInteracting()) return
			if (row.updated_at === lastServerUpdatedAtRef.current) return
			if (row.updated_at === pendingSaveUpdatedAtRef.current) return

			setDashboard(row.instances, row.layouts)
			lastServerUpdatedAtRef.current = row.updated_at
		},
		[setDashboard],
	)

	const persistDashboard = useCallback(
		async (options: { keepalive?: boolean } = {}) => {
			if (!user || !supabase || !readyRef.current || savingRef.current) return

			const row: DashboardRow = {
				user_id: user.id,
				instances: useDashboardStore.getState().instances,
				layouts: useDashboardStore.getState().layouts,
				updated_at: new Date().toISOString(),
			}

			pendingSaveUpdatedAtRef.current = row.updated_at
			lastServerUpdatedAtRef.current = row.updated_at

			if (options.keepalive) {
				const { data: sessionData } = await supabase.auth.getSession()
				const token = sessionData.session?.access_token
				const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
				const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

				if (token && supabaseUrl && anonKey) {
					saveDashboardRowKeepalive(supabaseUrl, anonKey, token, row)
					return
				}
			}

			savingRef.current = true
			const { data: saved, error } = await saveDashboardRow(supabase, row)
			savingRef.current = false

			if (error) {
				console.error('[dashboard] Failed to save:', error)
				setSyncError(
					error.includes('dashboard_layouts')
						? 'Run supabase/dashboard_layouts.sql in Supabase SQL Editor.'
						: `Sync error: ${error}`,
				)
				return
			}

			if (saved) {
				lastServerUpdatedAtRef.current = saved.updated_at
				pendingSaveUpdatedAtRef.current = saved.updated_at
			}
			setSyncError(null)
		},
		[user],
	)

	const loadDashboard = useCallback(async () => {
		if (!user || !supabase) {
			setHydrated(true)
			readyRef.current = true
			return
		}

		const { data, error } = await fetchDashboardRow(supabase, user.id)

		if (error) {
			setSyncError(
				error.includes('dashboard_layouts')
					? 'Run supabase/dashboard_layouts.sql in Supabase SQL Editor.'
					: `Sync error: ${error}`,
			)
			setHydrated(true)
			readyRef.current = true
			return
		}

		if (data) {
			setDashboard(data.instances, data.layouts)
			lastServerUpdatedAtRef.current = data.updated_at
		} else {
			const defaultInstances = createDefaultInstances()
			const defaultLayouts = createDefaultLayouts(defaultInstances)
			setDashboard(defaultInstances, defaultLayouts)
			await persistDashboard()
		}

		setHydrated(true)
		readyRef.current = true
	}, [user, setDashboard, setHydrated, persistDashboard])

	useEffect(() => {
		readyRef.current = false
		lastServerUpdatedAtRef.current = null
		pendingSaveUpdatedAtRef.current = null
		void loadDashboard()
	}, [loadDashboard])

	useEffect(() => {
		registerDashboardSaveHandler(() => {
			void persistDashboard()
		})
		return () => registerDashboardSaveHandler(null)
	}, [persistDashboard])

	useEffect(() => {
		if (!user || !supabase) return

		const channel = supabase
			.channel(`dashboard-${user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'dashboard_layouts',
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					if (isRemotePaused() || isGridInteracting()) return
					const remote = payload.new
					if (!isDashboardRow(remote)) return
					applyRemoteRow(remote)
				},
			)
			.subscribe()

		return () => {
			if (supabase) {
				void supabase.removeChannel(channel)
			}
		}
	}, [user, applyRemoteRow])

	useEffect(() => {
		function flush() {
			if (!readyRef.current || isGridInteracting()) return
			void persistDashboard({ keepalive: true })
		}

		window.addEventListener('pagehide', flush)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') flush()
		})

		return () => {
			window.removeEventListener('pagehide', flush)
		}
	}, [persistDashboard])

	return { syncError }
}
