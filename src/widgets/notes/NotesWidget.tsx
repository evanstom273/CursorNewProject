import { StickyNote } from 'lucide-react'
import type { WidgetProps } from '../types'

const PLACEHOLDER_NOTES = [
	'Review widget architecture docs',
	'Set up Supabase tables for dashboard layout',
	'Add Capacitor iOS build pipeline',
]

export function NotesWidget({ instanceId }: WidgetProps) {
	return (
		<div className="flex h-full flex-col gap-3" data-widget-instance={instanceId}>
			<div className="flex items-center gap-2 text-sm font-medium">
				<StickyNote className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				<span>Quick notes</span>
			</div>
			<ul className="flex flex-1 flex-col gap-2 overflow-auto">
				{PLACEHOLDER_NOTES.map((note) => (
					<li
						key={note}
						className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
					>
						{note}
					</li>
				))}
			</ul>
			<p className="text-xs text-muted-foreground/70">Placeholder — persist notes via Supabase</p>
		</div>
	)
}
