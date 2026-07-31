import { StickyNote } from 'lucide-react'
import type { WidgetDefinition } from '../types'
import { NotesWidget } from './NotesWidget'

export const notesWidget: WidgetDefinition = {
	type: 'notes',
	title: 'Notes',
	description: 'Quick notes and reminders',
	icon: StickyNote,
	defaultLayout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
	component: NotesWidget,
}
