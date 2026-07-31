import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import {
	createDefaultInstances,
	createDefaultLayouts,
	useDashboardStore,
	type LayoutsByBreakpoint,
} from '@/stores/dashboard-store'
import type { WidgetInstance } from '@/widgets/types'

const LAYOUT_SAVE_DEBOUNCE_MS = 500

function isLayoutsByBreakpoint(value: unknown): value is LayoutsByBreakpoint {
	if (!value || typeof value !== 'object') return false
	const keys = ['lg', 'md', 'sm', 'xs', 'xxs'] as const
	return keys.every((key) => Array.isArray((value as LayoutsByBreakpoint)[key]))
}

function isWidgetInstanceArray(value: unknown): value is WidgetInstance[] {
	return Array.isArray(value)
}

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
	const lastRemoteUpdatedAtRef = useRef<string | null>(null)

	instancesRef.current = instances
	layoutsRef.current = layouts

	const persistDashboard = useCallback(
		async (source: 'local' | 'remote' = 'local') => {
			if (!user || !supabase || !readyToSyncRef.current || isApplyingRemoteRef.current) {
				return
			}

			const { error } = await supabase.from('dashboard_layouts').upsert(
				{
					user_id: user.id,
					instances: instancesRef.current,
					layouts: layoutsRef.current,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: 'user_id' },
			)

			if (error) {
				console.error('[dashboard] Failed to save layout:', error.message)
				if (source === 'local') {
					setSyncError(
						error.code === 'PGRST205'
							? 'Dashboard sync table missing — run supabase/dashboard_layouts.sql in Supabase.'
							: `Failed to save dashboard: ${error.message}`,
					)
				}
				return
			}

			if (source === 'local') {
				setSyncError(null)
			}
		},
		[user],
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

		const { data, error } = await supabase
			.from('dashboard_layouts')
			.select('instances, layouts, updated_at')
			.eq('user_id', user.id)
			.maybeSingle()

		if (error) {
			console.error('[dashboard] Failed to load layout:', error.message)
			setSyncError(
				error.code === 'PGRST205'
					? 'Dashboard sync table missing — run supabase/dashboard_layouts.sql in Supabase.'
					: `Failed to load dashboard: ${error.message}`,
			)
			setHydrated(true)
			readyToSyncRef.current = true
			return
		}

		if (data && isWidgetInstanceArray(data.instances) && isLayoutsByBreakpoint(data.layouts)) {
			isApplyingRemoteRef.current = true
			setDashboard(data.instances, data.layouts)
			lastRemoteUpdatedAtRef.current = data.updated_at ?? null
			isApplyingRemoteRef.current = false
		} else if (!data) {
			const defaultInstances = createDefaultInstances()
			const defaultLayouts = createDefaultLayouts(defaultInstances)
			isApplyingRemoteRef.current = true
			setDashboard(defaultInstances, defaultLayouts)
			isApplyingRemoteRef.current = false

			await persistDashboard('local')
		}

		setHydrated(true)
		readyToSyncRef.current = true
	}, [user, setDashboard, setHydrated, persistDashboard])

	// Initial load + refetch when user changes
	useEffect(() => {
		void loadDashboard()
	}, [loadDashboard])

	// Refetch when tab regains focus (picks up changes from other devices)
	useEffect(() => {
		function handleFocus() {
			if (document.visibilityState === 'visible') {
				void loadDashboard()
			}
		}

		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleFocus)

		return () => {
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleFocus)
		}
	}, [loadDashboard])

	// Realtime: apply remote changes from other devices immediately
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
					const row = payload.new as {
						instances?: unknown
						layouts?: unknown
						updated_at?: string
					}

					if (!row?.instances || !row?.layouts) return
					if (row.updated_at && row.updated_at === lastRemoteUpdatedAtRef.current) return

					if (
						isWidgetInstanceArray(row.instances) &&
						isLayoutsByBreakpoint(row.layouts)
					) {
						isApplyingRemoteRef.current = true
						setDashboard(row.instances, row.layouts)
						lastRemoteUpdatedAtRef.current = row.updated_at ?? null
						isApplyingRemoteRef.current = false
					}
				},
			)
			.subscribe()

		return () => {
			if (supabase) {
				void supabase.removeChannel(channel)
			}
		}
	}, [user, setDashboard])

	// Save immediately when widgets are added or removed
	const instancesKey = JSON.stringify(instances)

	useEffect(() => {
		if (!hydrated || !readyToSyncRef.current || isApplyingRemoteRef.current) return
		void persistDashboard('local')
	}, [hydrated, instancesKey, persistDashboard])

	// Debounce layout-only changes (drag / resize)
	useEffect(() => {
		if (!hydrated || !readyToSyncRef.current || isApplyingRemoteRef.current) return

		if (layoutTimerRef.current) {
			clearTimeout(layoutTimerRef.current)
		}

		layoutTimerRef.current = setTimeout(() => {
			void persistDashboard('local')
		}, LAYOUT_SAVE_DEBOUNCE_MS)

		return () => {
			if (layoutTimerRef.current) {
				clearTimeout(layoutTimerRef.current)
			}
		}
	}, [hydrated, layouts, persistDashboard])

	// Flush pending save when user leaves the page
	useEffect(() => {
		function flush() {
			if (!readyToSyncRef.current) return
			if (layoutTimerRef.current) {
				clearTimeout(layoutTimerRef.current)
			}
			void persistDashboard('local')
		}

		window.addEventListener('pagehide', flush)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				flush()
			}
		})

		return () => {
			window.removeEventListener('pagehide', flush)
		}
	}, [persistDashboard])

	return { syncError, reload: loadDashboard }
}
