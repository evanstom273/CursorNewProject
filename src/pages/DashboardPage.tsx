import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { useDashboardSync } from '@/hooks/use-dashboard-sync'
import { useDashboardStore } from '@/stores/dashboard-store'

export function DashboardPage() {
	useDashboardSync()
	const hydrated = useDashboardStore((s) => s.hydrated)

	if (!hydrated) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
				Syncing dashboard…
			</div>
		)
	}

	return (
		<div className="mx-auto w-full max-w-screen-2xl">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Drag widgets to rearrange. Resize from the bottom-right corner.
				</p>
			</div>
			<WidgetGrid />
		</div>
	)
}
