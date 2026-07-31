import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
	fetchDashboardRow,
	isDashboardRow,
	isRemoteNewer,
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

const LAYOUT_SAVE_DEBOUNCE_MS = 500

export function useDashboardSync() {
	const { user } = useAuth()
	const instances = useDashboardStore((s) => s.instances)
	const layouts = useDashboardStore((s) => s.layouts)
	const hydrated = useDashboardStore((s) => s.hydrated)
	const setDashboard = useDashboardStore((s) => s.setDashboard)
	const setHydrated = useDashboardStore((s) => s.setHydrated)

	const [syncError, setSyncError] = useState<string | null>(null)
	const readyToSyncRef = useRef(false)
	const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const instancesRef = useRef(instances)
	const layoutsRef = useRef(layouts)
	const isApplyingRemoteRef = useRef(false)
	const lastKnownServerUpdatedAtRef = useRef<string | null>(null)
	const lastLocalEditAtRef = useRef(0)

	instancesRef.current = instances
	layoutsRef.current = layouts

	const applyRemoteRow = useCallback(
		(row: DashboardRow) => {
			isApplyingRemoteRef.current = true
			setDashboard(row.instances, row.layouts)
			lastKnownServerUpdatedAtRef.current = row.updated_at
			isApplyingRemoteRef.current = false
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
			if (!user || !supabase || !readyToSyncRef.current || isApplyingRemoteRef.current) {
				return
			}

			const localRow = buildLocalRow()
			if (!localRow) return

			// Prevent stale desktop state overwriting a newer mobile save
			const { data: remote, error: fetchError } = await fetchDashboardRow(supabase, user.id)
			if (fetchError) {
				setSyncError(`Failed to load dashboard: ${fetchError}`)
				return
			}

			if (
				remote &&
				isRemoteNewer(remote.updated_at, lastKnownServerUpdatedAtRef.current) &&
				lastLocalEditAtRef.current < new Date(remote.updated_at).getTime()
			) {
				applyRemoteRow(remote)
				return
			}

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
		},
		[user, buildLocalRow, applyRemoteRow],
	)

	const loadDashboard = useCallback(async () => {
		if (!user || !supabase) {
			setHydrated(true)
			readyToSyncRef.current = true
			return
		}

		readyToSyncRef.current = false
		setHydrated(false)
		setSyncError(null)

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
		} else {
			const defaultInstances = createDefaultInstances()
			const defaultLayouts = createDefaultLayouts(defaultInstances)
			isApplyingRemoteRef.current = true
			setDashboard(defaultInstances, defaultLayouts)
			isApplyingRemoteRef.current = false
			lastLocalEditAtRef.current = Date.now()
			await persistDashboard()
		}

		setHydrated(true)
		readyToSyncRef.current = true
	}, [user, setDashboard, setHydrated, applyRemoteRow, persistDashboard])

	useEffect(() => {
		void loadDashboard()
	}, [loadDashboard])

	useEffect(() => {
		function handleVisible() {
			if (document.visibilityState === 'visible') {
				void loadDashboard()
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
					const remote = payload.new
					if (!isDashboardRow(remote)) return

					if (
						remote.updated_at === lastKnownServerUpdatedAtRef.current ||
						lastLocalEditAtRef.current > new Date(remote.updated_at).getTime()
					) {
						return
					}

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
	const layoutsKey = JSON.stringify(layouts)

	useEffect(() => {
		if (!hydrated || !readyToSyncRef.current || isApplyingRemoteRef.current) return
		lastLocalEditAtRef.current = Date.now()
		void persistDashboard()
	}, [hydrated, instancesKey, persistDashboard])

	useEffect(() => {
		if (!hydrated || !readyToSyncRef.current || isApplyingRemoteRef.current) return

		lastLocalEditAtRef.current = Date.now()

		if (layoutTimerRef.current) {
			clearTimeout(layoutTimerRef.current)
		}

		layoutTimerRef.current = setTimeout(() => {
			void persistDashboard()
		}, LAYOUT_SAVE_DEBOUNCE_MS)

		return () => {
			if (layoutTimerRef.current) {
				clearTimeout(layoutTimerRef.current)
			}
		}
	}, [hydrated, layoutsKey, persistDashboard])

	useEffect(() => {
		function flushKeepalive() {
			if (!readyToSyncRef.current) return
			if (layoutTimerRef.current) {
				clearTimeout(layoutTimerRef.current)
			}
			lastLocalEditAtRef.current = Date.now()
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

	return { syncError, reload: loadDashboard }
}
