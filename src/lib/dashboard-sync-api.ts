import type { SupabaseClient } from '@supabase/supabase-js'
import type { LayoutsByBreakpoint } from '@/stores/dashboard-store'
import type { WidgetInstance } from '@/widgets/types'

export interface DashboardRow {
	user_id: string
	instances: WidgetInstance[]
	layouts: LayoutsByBreakpoint
	updated_at: string
}

export function isLayoutsByBreakpoint(value: unknown): value is LayoutsByBreakpoint {
	if (!value || typeof value !== 'object') return false
	const keys = ['lg', 'md', 'sm', 'xs', 'xxs'] as const
	return keys.every((key) => Array.isArray((value as LayoutsByBreakpoint)[key]))
}

export function isWidgetInstanceArray(value: unknown): value is WidgetInstance[] {
	return Array.isArray(value)
}

export function isDashboardRow(value: unknown): value is DashboardRow {
	if (!value || typeof value !== 'object') return false
	const row = value as DashboardRow
	return (
		typeof row.user_id === 'string' &&
		isWidgetInstanceArray(row.instances) &&
		isLayoutsByBreakpoint(row.layouts) &&
		typeof row.updated_at === 'string'
	)
}

export async function fetchDashboardRow(
	supabase: SupabaseClient,
	userId: string,
): Promise<{ data: DashboardRow | null; error: string | null }> {
	const { data, error } = await supabase
		.from('dashboard_layouts')
		.select('user_id, instances, layouts, updated_at')
		.eq('user_id', userId)
		.maybeSingle()

	if (error) {
		return { data: null, error: error.message }
	}

	if (data && isDashboardRow(data)) {
		return { data, error: null }
	}

	return { data: null, error: null }
}

export async function saveDashboardRow(
	supabase: SupabaseClient,
	row: DashboardRow,
): Promise<{ data: DashboardRow | null; error: string | null }> {
	const { data, error } = await supabase
		.from('dashboard_layouts')
		.upsert(row, { onConflict: 'user_id' })
		.select('user_id, instances, layouts, updated_at')
		.single()

	if (error) {
		return { data: null, error: error.message }
	}

	if (data && isDashboardRow(data)) {
		return { data, error: null }
	}

	return { data: null, error: 'Invalid dashboard response from server.' }
}

/** Best-effort save when the page is closing (mobile Safari). */
export function saveDashboardRowKeepalive(
	supabaseUrl: string,
	anonKey: string,
	accessToken: string,
	row: DashboardRow,
): void {
	const url = `${supabaseUrl}/rest/v1/dashboard_layouts?on_conflict=user_id`

	void fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: anonKey,
			Authorization: `Bearer ${accessToken}`,
			Prefer: 'resolution=merge-duplicates,return=minimal',
		},
		body: JSON.stringify(row),
		keepalive: true,
	})
}

export function isRemoteNewer(
	remoteUpdatedAt: string | null,
	lastKnownUpdatedAt: string | null,
): boolean {
	if (!remoteUpdatedAt) return false
	if (!lastKnownUpdatedAt) return true
	return new Date(remoteUpdatedAt).getTime() > new Date(lastKnownUpdatedAt).getTime()
}
