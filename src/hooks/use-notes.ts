import { useCallback, useEffect, useState } from 'react'
import { getClientId } from '@/lib/client-id'
import { supabase } from '@/lib/supabase'

export interface Note {
	id: string
	content: string
	position: number
}

const LOCAL_STORAGE_KEY = 'dashboard-notes'

function loadLocalNotes(): Note[] {
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
		if (!raw) return getDefaultNotes()
		return JSON.parse(raw) as Note[]
	} catch {
		return getDefaultNotes()
	}
}

function saveLocalNotes(notes: Note[]) {
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes))
}

function getDefaultNotes(): Note[] {
	return [
		{ id: crypto.randomUUID(), content: '', position: 0 },
		{ id: crypto.randomUUID(), content: '', position: 1 },
		{ id: crypto.randomUUID(), content: '', position: 2 },
	]
}

export function useNotes() {
	const [notes, setNotes] = useState<Note[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [usingLocalFallback, setUsingLocalFallback] = useState(false)

	const loadNotes = useCallback(async () => {
		setLoading(true)
		setError(null)

		if (!supabase) {
			setNotes(loadLocalNotes())
			setUsingLocalFallback(true)
			setLoading(false)
			return
		}

		const clientId = getClientId()
		const { data, error: fetchError } = await supabase
			.from('notes')
			.select('id, content, position')
			.eq('client_id', clientId)
			.order('position', { ascending: true })

		if (fetchError) {
			setNotes(loadLocalNotes())
			setUsingLocalFallback(true)
			setError(
				fetchError.code === 'PGRST205' || fetchError.message.includes('does not exist')
					? 'Notes table missing — run supabase/notes.sql in the Supabase SQL Editor.'
					: fetchError.message,
			)
			setLoading(false)
			return
		}

		if (!data || data.length === 0) {
			const defaults = getDefaultNotes()
			setNotes(defaults)
			setUsingLocalFallback(false)

			await supabase.from('notes').insert(
				defaults.map((note) => ({
					id: note.id,
					client_id: clientId,
					content: note.content,
					position: note.position,
				})),
			)
		} else {
			setNotes(data)
			setUsingLocalFallback(false)
		}

		setLoading(false)
	}, [])

	useEffect(() => {
		void loadNotes()
	}, [loadNotes])

	const persistNotes = useCallback(async (nextNotes: Note[]) => {
		setNotes(nextNotes)

		if (!supabase) {
			saveLocalNotes(nextNotes)
			setUsingLocalFallback(true)
			return
		}

		const clientId = getClientId()
		const { error: upsertError } = await supabase.from('notes').upsert(
			nextNotes.map((note) => ({
				id: note.id,
				client_id: clientId,
				content: note.content,
				position: note.position,
				updated_at: new Date().toISOString(),
			})),
		)

		if (upsertError) {
			saveLocalNotes(nextNotes)
			setUsingLocalFallback(true)
			setError(upsertError.message)
		} else {
			setUsingLocalFallback(false)
		}
	}, [])

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

			if (supabase && !usingLocalFallback) {
				const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
				if (deleteError) {
					setUsingLocalFallback(true)
					setError(deleteError.message)
				}
			}

			void persistNotes(nextNotes)
		},
		[notes, persistNotes, usingLocalFallback],
	)

	return {
		notes,
		loading,
		error,
		usingLocalFallback,
		updateNote,
		addNote,
		deleteNote,
		reload: loadNotes,
	}
}
