import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
	dashboardInteraction,
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

export function useDashboardSync() {
	const { user } = useAuth()
	const instances = useDashboardStore((s) => s.instances)
	const hydrated = useDashboardStore((s) => s.hydrated)
	const setDashboard = useDashboardStore((s) => s.setDashboard)
	const setHydrated = useDashboardStore((s) => s.setHydrated)

	const [syncError, setSyncError] = useState<string | null>(null)
	const readyToSyncRef = useRef(false)
	const isInitialLoadRef = useRef(true)
	const instancesRef = useRef(instances)
	const layoutsRef = useRef(useDashboardStore.getState().layouts)
	const lastKnownServerUpdatedAtRef = useRef<string | null>(null)
	const saveInFlightRef = useRef(false)

	instancesRef.current = instances
	layoutsRef.current = useDashboardStore.getState().layouts

	// Keep layouts ref fresh without re-subscribing the whole hook to layout changes
	useEffect(() => {
		return useDashboardStore.subscribe((state) => {
			layoutsRef.current = state.layouts
		})
	}, [])

	const applyRemoteRow = useCallback(
		(row: DashboardRow) => {
			if (dashboardInteraction.isInteracting) return

			setDashboard(row.instances, row.layouts)
			lastKnownServerUpdatedAtRef.current = row.updated_at
		},
		[setDashboard],
	)

	const buildLocalRow = useCallback((): DashboardRow | null => {
		if (!user) return null
		return {
			user_id: user.id,
			instances: instancesRef.current,
			layouts: layoutsRef.current,
			updated_at: new Date().toISOString(),
		}
	}, [user])

	const persistDashboard = useCallback(
		async (options: { keepalive?: boolean } = {}) => {
			if (
				!user ||
				!supabase ||
				!readyToSyncRef.current ||
				dashboardInteraction.isInteracting ||
				saveInFlightRef.current
			) {
				return
			}

			const localRow = buildLocalRow()
			if (!localRow) return

			saveInFlightRef.current = true

			try {
				if (options.keepalive) {
					const { data: sessionData } = await supabase.auth.getSession()
					const token = sessionData.session?.access_token
					const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
					const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

					if (token && supabaseUrl && anonKey) {
						saveDashboardRowKeepalive(supabaseUrl, anonKey, token, localRow)
						lastKnownServerUpdatedAtRef.current = localRow.updated_at
						return
					}
				}

				const { data: saved, error: saveError } = await saveDashboardRow(supabase, localRow)
				if (saveError) {
					console.error('[dashboard] Failed to save layout:', saveError)
					setSyncError(
						saveError.includes('dashboard_layouts')
							? 'Dashboard sync table missing — run supabase/dashboard_layouts.sql in Supabase.'
							: `Failed to save dashboard: ${saveError}`,
					)
					return
				}

				if (saved) {
					lastKnownServerUpdatedAtRef.current = saved.updated_at
				}
				setSyncError(null)
			} finally {
				saveInFlightRef.current = false
			}
		},
		[user, buildLocalRow],
	)

	const loadDashboard = useCallback(
		async (background = false) => {
			if (!user || !supabase) {
				setHydrated(true)
				readyToSyncRef.current = true
				return
			}

			if (dashboardInteraction.isInteracting) return

			readyToSyncRef.current = false
			if (!background) {
				setHydrated(false)
			}

			const { data, error } = await fetchDashboardRow(supabase, user.id)

			if (error) {
				console.error('[dashboard] Failed to load layout:', error)
				setSyncError(
					error.includes('dashboard_layouts')
						? 'Dashboard sync table missing — run supabase/dashboard_layouts.sql in Supabase.'
						: `Failed to load dashboard: ${error}`,
				)
				setHydrated(true)
				readyToSyncRef.current = true
				return
			}

			if (data) {
				applyRemoteRow(data)
			} else if (isInitialLoadRef.current) {
				const defaultInstances = createDefaultInstances()
				const defaultLayouts = createDefaultLayouts(defaultInstances)
				setDashboard(defaultInstances, defaultLayouts)
				await persistDashboard()
			}

			isInitialLoadRef.current = false
			setHydrated(true)
			readyToSyncRef.current = true
		},
		[user, setDashboard, setHydrated, applyRemoteRow, persistDashboard],
	)

	useEffect(() => {
		void loadDashboard(false)
	}, [loadDashboard])

	useEffect(() => {
		registerLayoutSaveHandler(() => {
			void persistDashboard()
		})
		return () => registerLayoutSaveHandler(null)
	}, [persistDashboard])

	useEffect(() => {
		function handleVisible() {
			if (document.visibilityState === 'visible') {
				void loadDashboard(true)
			}
		}

		window.addEventListener('focus', handleVisible)
		document.addEventListener('visibilitychange', handleVisible)

		return () => {
			window.removeEventListener('focus', handleVisible)
			document.removeEventListener('visibilitychange', handleVisible)
		}
	}, [loadDashboard])

	useEffect(() => {
		if (!user || !supabase) return

		const channel = supabase
			.channel(`dashboard-layout-${user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'dashboard_layouts',
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					if (dashboardInteraction.isInteracting || saveInFlightRef.current) return

					const remote = payload.new
					if (!isDashboardRow(remote)) return
					if (remote.updated_at === lastKnownServerUpdatedAtRef.current) return

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

	const instancesKey = JSON.stringify(instances)

	useEffect(() => {
		if (!hydrated || !readyToSyncRef.current) return
		void persistDashboard()
	}, [hydrated, instancesKey, persistDashboard])

	useEffect(() => {
		function flushKeepalive() {
			if (!readyToSyncRef.current || dashboardInteraction.isInteracting) return
			void persistDashboard({ keepalive: true })
		}

		window.addEventListener('pagehide', flushKeepalive)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				flushKeepalive()
			}
		})

		return () => {
			window.removeEventListener('pagehide', flushKeepalive)
		}
	}, [persistDashboard])

	return { syncError, reload: () => loadDashboard(true) }
}
