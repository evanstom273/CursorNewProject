import { CalendarDays } from 'lucide-react'
import type { WidgetProps } from '../types'

const PLACEHOLDER_EVENTS = [
	{ time: '09:00', title: 'Team standup' },
	{ time: '13:30', title: 'Lunch with Alex' },
	{ time: '16:00', title: 'Project review' },
]

export function CalendarWidget({ instanceId }: WidgetProps) {
	const today = new Date().toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	})

	return (
		<div className="flex h-full flex-col gap-3" data-widget-instance={instanceId}>
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<CalendarDays className="size-4 shrink-0" aria-hidden="true" />
				<span>{today}</span>
			</div>
			<ul className="flex flex-1 flex-col gap-2 overflow-auto">
				{PLACEHOLDER_EVENTS.map((event) => (
					<li
						key={event.time}
						className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm"
					>
						<span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
							{event.time}
						</span>
						<span>{event.title}</span>
					</li>
				))}
			</ul>
			<p className="text-xs text-muted-foreground/70">Placeholder — sync with Supabase or a calendar API</p>
		</div>
	)
}
