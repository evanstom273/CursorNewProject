import { GripVertical, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requestDashboardSave } from '@/lib/dashboard-interaction'
import { useDashboardStore } from '@/stores/dashboard-store'

interface WidgetWrapperProps {
	instanceId: string
	title: string
	children: ReactNode
}

export function WidgetWrapper({ instanceId, title, children }: WidgetWrapperProps) {
	const removeWidget = useDashboardStore((s) => s.removeWidget)

	return (
		<Card className="flex h-full flex-col overflow-hidden shadow-none">
			<CardHeader className="flex flex-row items-center gap-2 space-y-0 p-3 pb-2">
				<button
					type="button"
					className="widget-drag-handle cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
					aria-label={`Drag ${title} widget`}
				>
					<GripVertical className="size-4" />
				</button>
				<CardTitle className="flex-1 text-sm font-medium">{title}</CardTitle>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 shrink-0"
					onClick={() => {
						removeWidget(instanceId)
						requestDashboardSave()
					}}
					aria-label={`Remove ${title} widget`}
				>
					<X className="size-3.5" />
				</Button>
			</CardHeader>
			<CardContent className="flex-1 overflow-auto p-3 pt-0">{children}</CardContent>
		</Card>
	)
}
