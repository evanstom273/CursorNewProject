import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import {
	createDefaultInstances,
	createDefaultLayouts,
	useDashboardStore,
	type LayoutsByBreakpoint,
} from '@/stores/dashboard-store'
import type { WidgetInstance } from '@/widgets/types'

const SAVE_DEBOUNCE_MS = 600

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
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const isLoadingRef = useRef(false)

	useEffect(() => {
		if (!user || !supabase) {
			setHydrated(true)
			return
		}

		let cancelled = false
		isLoadingRef.current = true

		async function loadDashboard() {
			const { data, error } = await supabase!
				.from('dashboard_layouts')
				.select('instances, layouts')
				.eq('user_id', user!.id)
				.maybeSingle()

			if (cancelled) return

			if (error) {
				console.error('[dashboard] Failed to load layout:', error.message)
				setHydrated(true)
				isLoadingRef.current = false
				return
			}

			if (
				data &&
				isWidgetInstanceArray(data.instances) &&
				isLayoutsByBreakpoint(data.layouts)
			) {
				setDashboard(data.instances, data.layouts)
			} else if (!data) {
				const defaultInstances = createDefaultInstances()
				const defaultLayouts = createDefaultLayouts(defaultInstances)
				setDashboard(defaultInstances, defaultLayouts)

				await supabase!.from('dashboard_layouts').upsert({
					user_id: user!.id,
					instances: defaultInstances,
					layouts: defaultLayouts,
					updated_at: new Date().toISOString(),
				})
			}

			setHydrated(true)
			isLoadingRef.current = false
		}

		setHydrated(false)
		void loadDashboard()

		return () => {
			cancelled = true
		}
	}, [user, setDashboard, setHydrated])

	useEffect(() => {
		if (!user || !supabase || !hydrated || isLoadingRef.current) return

		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current)
		}

		saveTimerRef.current = setTimeout(() => {
			void supabase!
				.from('dashboard_layouts')
				.upsert({
					user_id: user.id,
					instances,
					layouts,
					updated_at: new Date().toISOString(),
				})
				.then(({ error }) => {
					if (error) {
						console.error('[dashboard] Failed to save layout:', error.message)
					}
				})
		}, SAVE_DEBOUNCE_MS)

		return () => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current)
			}
		}
	}, [user, instances, layouts, hydrated])
}
