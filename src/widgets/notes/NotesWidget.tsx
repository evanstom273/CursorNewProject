import { Plus, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useNotes } from '@/hooks/use-notes'
import type { WidgetProps } from '../types'

export function NotesWidget({ instanceId }: WidgetProps) {
	const { notes, loading, error, updateNote, addNote, deleteNote } = useNotes()

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
				Loading notes…
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col gap-3" data-widget-instance={instanceId}>
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-medium">
					<StickyNote className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					<span>Quick notes</span>
				</div>
				<Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={addNote}>
					<Plus className="size-3.5" aria-hidden="true" />
					Add
				</Button>
			</div>

			{error && (
				<p className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
					{error}
				</p>
			)}

			<div className="flex flex-1 flex-col gap-2 overflow-auto">
				{notes.map((note) => (
					<div key={note.id} className="group relative">
						<Textarea
							value={note.content}
							onChange={(e) => updateNote(note.id, e.target.value)}
							placeholder="Write a note…"
							className="min-h-[72px] resize-none bg-muted/30 pr-10"
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
							onClick={() => void deleteNote(note.id)}
							aria-label="Delete note"
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
			</div>

			<p className="text-xs text-muted-foreground/70">Saving to your account</p>
		</div>
	)
}
