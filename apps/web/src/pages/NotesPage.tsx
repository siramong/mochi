import { useEffect, useMemo, useRef, useState } from 'react'
import { Pin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { QuickNote } from '@/types/database'

const noteColors: Record<QuickNote['color'], string> = {
  yellow: 'bg-yellow-100 border-yellow-200',
  pink: 'bg-pink-100 border-pink-200',
  blue: 'bg-blue-100 border-blue-200',
  teal: 'bg-teal-100 border-teal-200',
  purple: 'bg-purple-100 border-purple-200',
}

type DraftMap = Record<string, { title: string; content: string; color: QuickNote['color']; is_pinned: boolean }>

export function NotesPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [notes, setNotes] = useState<QuickNote[]>([])
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!userId) {
      setNotes([])
      setError(null)
      setLoading(false)
      return
    }

    let isActive = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('quick_notes')
          .select('*')
          .eq('user_id', userId)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false })
          .returns<QuickNote[]>()

        if (!isActive) {
          return
        }

        if (fetchError) {
          setError(fetchError.message)
          setNotes([])
        } else {
          setNotes(data ?? [])
        }
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error('Error inesperado cargando notas:', loadError)
        setError('No se pudieron cargar las notas')
        setNotes([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [userId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((note) => [note.title ?? '', note.content].join(' ').toLowerCase().includes(q))
  }, [notes, search])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.updated_at.localeCompare(a.updated_at)),
    [filtered]
  )

  const scheduleSave = (id: string, nextDraft: DraftMap[string]) => {
    if (!userId) return
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id])

    saveTimers.current[id] = setTimeout(() => {
      void supabase
        .from('quick_notes')
        .update({
          title: nextDraft.title.trim() || null,
          content: nextDraft.content,
          color: nextDraft.color,
          is_pinned: nextDraft.is_pinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)

      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? {
                ...note,
                title: nextDraft.title.trim() || null,
                content: nextDraft.content,
                color: nextDraft.color,
                is_pinned: nextDraft.is_pinned,
                updated_at: new Date().toISOString(),
              }
            : note
        )
      )
    }, 800)
  }

  const createNote = async () => {
    if (!userId) return

    const { data, error: createError } = await supabase
      .from('quick_notes')
      .insert({
        user_id: userId,
        title: null,
        content: '',
        color: 'yellow',
        is_pinned: false,
      })
      .select('*')
      .single<QuickNote>()

    if (createError || !data) {
      setError(createError?.message ?? 'No se pudo crear la nota')
      return
    }

    setNotes((prev) => [data, ...prev])
    setDrafts((prev) => ({
      ...prev,
      [data.id]: { title: '', content: '', color: 'yellow', is_pinned: false },
    }))
    setEditingId(data.id)
    setCreating(false)
  }

  const startEdit = (note: QuickNote) => {
    setEditingId(note.id)
    setDrafts((prev) => ({
      ...prev,
      [note.id]: {
        title: note.title ?? '',
        content: note.content,
        color: note.color,
        is_pinned: note.is_pinned,
      },
    }))
  }

  const updateDraft = (id: string, patch: Partial<DraftMap[string]>) => {
    const current = drafts[id]
    if (!current) return
    const next = { ...current, ...patch }
    setDrafts((prev) => ({ ...prev, [id]: next }))
    scheduleSave(id, next)
  }

  if (loading) return <p className="text-sm font-semibold text-purple-700">Cargando notas...</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Notas rápidas</h1>
          <p className="text-sm text-purple-700">Captura ideas sin cortar tu flujo.</p>
        </div>
        <button
          type="button"
          className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setCreating(true)}
        >
          Nueva nota
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar notas..."
        className="mt-4 w-full rounded-2xl border border-purple-200 bg-white px-4 py-2 text-sm"
      />

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {creating ? (
        <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-bold text-yellow-900">Nueva nota lista para editar</p>
          <button
            type="button"
            className="mt-2 rounded-xl bg-yellow-500 px-3 py-2 text-xs font-bold text-white"
            onClick={() => {
              void createNote()
            }}
          >
            Crear y editar
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((note) => {
          const editing = editingId === note.id
          const draft = drafts[note.id]

          return (
            <article
              key={note.id}
              className={`rounded-2xl border p-4 ${noteColors[note.color]}`}
              onClick={() => startEdit(note)}
            >
              {editing && draft ? (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <input
                      value={draft.title}
                      onChange={(event) => updateDraft(note.id, { title: event.target.value })}
                      placeholder="Título (opcional)"
                      className="w-full rounded-lg border border-white/80 bg-white/70 px-2 py-1 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      className={`rounded-full p-1 ${draft.is_pinned ? 'bg-white text-purple-700' : 'bg-white/70 text-slate-600'}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        updateDraft(note.id, { is_pinned: !draft.is_pinned })
                      }}
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={draft.content}
                    onChange={(event) => updateDraft(note.id, { content: event.target.value })}
                    placeholder="Escribe tu nota"
                    className="min-h-28 w-full rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-sm"
                  />

                  <div className="mt-2 flex gap-2">
                    {(['yellow', 'pink', 'blue', 'teal', 'purple'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-5 w-5 rounded-full border ${draft.color === color ? 'border-slate-900' : 'border-transparent'} ${noteColors[color].split(' ')[0]}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          updateDraft(note.id, { color })
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{note.title || 'Sin título'}</p>
                    {note.is_pinned ? <Pin className="h-4 w-4 text-purple-700" /> : null}
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{note.content || 'Toca para editar'}</p>
                </>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
