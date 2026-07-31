import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
	isRemotePaused,
	markLocalDashboardEdit,
	registerLayoutSaveHandler,
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

const SAVE_DEBOUNCE_MS = 800

export function useDashboardSync() {
	const { user } = useAuth()
	const instances = useDashboardStore((s) => s.instances)
	const layouts = useDashboardStore((s) => s.layouts)
	const hydrated = useDashboardStore((s) => s.hydrated)
	const setDashboard = useDashboardStore((s) => s.setDashboard)
	const setHydrated = useDashboardStore((s) => s.setHydrated)

	const [syncError, setSyncError] = useState<string | null>(null)
	const readyRef = useRef(false)
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastServerUpdatedAtRef = useRef<string | null>(null)

	const applyRemoteRow = useCallback(
		(row: DashboardRow) => {
			if (isRemotePaused()) return

			setDashboard(row.instances, row.layouts)
			lastServerUpdatedAtRef.current = row.updated_at
		},
		[setDashboard],
	)

	const persistDashboard = useCallback(
		async (options: { keepalive?: boolean } = {}) => {
			if (!user || !supabase || !readyRef.current) return

			const row: DashboardRow = {
				user_id: user.id,
				instances: useDashboardStore.getState().instances,
				layouts: useDashboardStore.getState().layouts,
				updated_at: new Date().toISOString(),
			}

			if (options.keepalive) {
				const { data: sessionData } = await supabase.auth.getSession()
				const token = sessionData.session?.access_token
				const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
				const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

				if (token && supabaseUrl && anonKey) {
					saveDashboardRowKeepalive(supabaseUrl, anonKey, token, row)
					lastServerUpdatedAtRef.current = row.updated_at
					return
				}
			}

			const { data: saved, error } = await saveDashboardRow(supabase, row)
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
			}
			setSyncError(null)
		},
		[user],
	)

	const scheduleSave = useCallback(() => {
		markLocalDashboardEdit()
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
		saveTimerRef.current = setTimeout(() => {
			void persistDashboard()
		}, SAVE_DEBOUNCE_MS)
	}, [persistDashboard])

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
			applyRemoteRow(data)
		} else {
			const defaultInstances = createDefaultInstances()
			const defaultLayouts = createDefaultLayouts(defaultInstances)
			setDashboard(defaultInstances, defaultLayouts)
			markLocalDashboardEdit()
			await persistDashboard()
		}

		setHydrated(true)
		readyRef.current = true
	}, [user, setDashboard, setHydrated, applyRemoteRow, persistDashboard])

	// Load once on sign-in
	useEffect(() => {
		readyRef.current = false
		void loadDashboard()
	}, [loadDashboard])

	// Register immediate save after drag/resize stops
	useEffect(() => {
		registerLayoutSaveHandler(() => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
			void persistDashboard()
		})
		return () => registerLayoutSaveHandler(null)
	}, [persistDashboard])

	// Realtime updates from other devices
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
					if (isRemotePaused()) return
					const remote = payload.new
					if (!isDashboardRow(remote)) return
					if (remote.updated_at === lastServerUpdatedAtRef.current) return
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

	// Debounced save when instances or layouts change
	const stateKey = JSON.stringify({ instances, layouts })

	useEffect(() => {
		if (!hydrated || !readyRef.current) return
		scheduleSave()
	}, [hydrated, stateKey, scheduleSave])

	// Flush on tab close (mobile)
	useEffect(() => {
		function flush() {
			if (!readyRef.current) return
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
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
