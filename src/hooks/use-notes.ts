import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

export interface Note {
	id: string
	content: string
	position: number
}

function getDefaultNotes(): Note[] {
	return [
		{ id: crypto.randomUUID(), content: '', position: 0 },
		{ id: crypto.randomUUID(), content: '', position: 1 },
		{ id: crypto.randomUUID(), content: '', position: 2 },
	]
}

function formatNotesError(fetchError: { code?: string; message: string }): string {
	if (fetchError.code === 'PGRST205') {
		return 'Notes table not found in API — run supabase/notes.sql in the Supabase SQL Editor.'
	}

	if (fetchError.code === '42703' || fetchError.message.includes('column notes.')) {
		return 'Notes table schema is outdated — re-run supabase/notes.sql in the Supabase SQL Editor.'
	}

	if (fetchError.code === '42501' || fetchError.message.toLowerCase().includes('row-level security')) {
		return 'Notes access denied — run supabase/auth.sql in the Supabase SQL Editor after enabling auth.'
	}

	return fetchError.message
}

export function useNotes() {
	const { user } = useAuth()
	const [notes, setNotes] = useState<Note[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const loadNotes = useCallback(async () => {
		setLoading(true)
		setError(null)

		if (!supabase || !user) {
			setNotes(getDefaultNotes())
			setLoading(false)
			return
		}

		const { data, error: fetchError } = await supabase
			.from('notes')
			.select('id, content, position')
			.eq('user_id', user.id)
			.order('position', { ascending: true })

		if (fetchError) {
			setError(formatNotesError(fetchError))
			setNotes(getDefaultNotes())
			setLoading(false)
			return
		}

		if (!data || data.length === 0) {
			const defaults = getDefaultNotes()
			setNotes(defaults)

			const { error: insertError } = await supabase.from('notes').insert(
				defaults.map((note) => ({
					id: note.id,
					user_id: user.id,
					content: note.content,
					position: note.position,
				})),
			)

			if (insertError) {
				setError(formatNotesError(insertError))
			}
		} else {
			setNotes(data)
		}

		setLoading(false)
	}, [user])

	useEffect(() => {
		void loadNotes()
	}, [loadNotes])

	const persistNotes = useCallback(
		async (nextNotes: Note[]) => {
			setNotes(nextNotes)

			if (!supabase || !user) return

			const { error: upsertError } = await supabase.from('notes').upsert(
				nextNotes.map((note) => ({
					id: note.id,
					user_id: user.id,
					content: note.content,
					position: note.position,
					updated_at: new Date().toISOString(),
				})),
			)

			if (upsertError) {
				setError(formatNotesError(upsertError))
			} else {
				setError(null)
			}
		},
		[user],
	)

	const updateNote = useCallback(
		(id: string, content: string) => {
			const nextNotes = notes.map((note) => (note.id === id ? { ...note, content } : note))
			void persistNotes(nextNotes)
		},
		[notes, persistNotes],
	)

	const addNote = useCallback(() => {
		const nextNote: Note = {
			id: crypto.randomUUID(),
			content: '',
			position: notes.length,
		}
		void persistNotes([...notes, nextNote])
	}, [notes, persistNotes])

	const deleteNote = useCallback(
		async (id: string) => {
			const nextNotes = notes.filter((note) => note.id !== id).map((note, index) => ({
				...note,
				position: index,
			}))

			if (supabase && user) {
				const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
				if (deleteError) {
					setError(formatNotesError(deleteError))
				}
			}

			void persistNotes(nextNotes)
		},
		[notes, persistNotes, user],
	)

	return {
		notes,
		loading,
		error,
		updateNote,
		addNote,
		deleteNote,
		reload: loadNotes,
	}
}
