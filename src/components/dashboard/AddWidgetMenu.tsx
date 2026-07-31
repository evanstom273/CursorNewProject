import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { requestDashboardSave } from '@/lib/dashboard-interaction'
import { widgetList } from '@/widgets/registry'
import { useDashboardStore } from '@/stores/dashboard-store'

export function AddWidgetMenu() {
	const addWidget = useDashboardStore((s) => s.addWidget)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="size-9 gap-2 px-0 sm:size-auto sm:px-3"
					aria-label="Add widget"
				>
					<Plus className="size-4 shrink-0" aria-hidden="true" />
					<span className="hidden sm:inline">Add widget</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel>Available widgets</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{widgetList.map((widget) => (
					<DropdownMenuItem
						key={widget.type}
						onClick={() => {
							addWidget(widget.type)
							requestDashboardSave()
						}}
						className="gap-2"
					>
						<widget.icon className="size-4" aria-hidden="true" />
						{widget.title}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
