import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { useSession } from '@/hooks/useSession'
import { addPoints } from '@/lib/gamification'
import { supabase } from '@/lib/supabase'
import type { GratitudeLog } from '@/types/database'

export function GratitudePage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [items, setItems] = useState<GratitudeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [entry1, setEntry1] = useState('')
  const [entry2, setEntry2] = useState('')
  const [entry3, setEntry3] = useState('')
  const [editingToday, setEditingToday] = useState(false)
  const [saving, setSaving] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadGratitude = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('gratitude_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false })
      .returns<GratitudeLog[]>()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setItems(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadGratitude()
  }, [loadGratitude])

  const todayEntry = useMemo(() => items.find((item) => item.logged_date === today) ?? null, [items, today])

  useEffect(() => {
    if (!todayEntry || !editingToday) return
    setEntry1(todayEntry.entry_1)
    setEntry2(todayEntry.entry_2 ?? '')
    setEntry3(todayEntry.entry_3 ?? '')
  }, [todayEntry, editingToday])

  const saveGratitude = async () => {
    if (!userId || !entry1.trim()) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    const { error: upsertError } = await supabase
      .from('gratitude_logs')
      .upsert(
        {
          user_id: userId,
          logged_date: today,
          entry_1: entry1.trim(),
          entry_2: entry2.trim() || null,
          entry_3: entry3.trim() || null,
        },
        { onConflict: 'user_id,logged_date' }
      )

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    await addPoints(userId, 3)
    setSuccessMessage('Registro guardado. Ganaste +3 puntos.')

    setEditingToday(false)
    await loadGratitude()
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-purple-700">Cargando gratitud...</p>

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Diario de gratitud</h1>
      <p className="mt-1 text-sm text-purple-700">Tres pensamientos positivos para cerrar el día con calma.</p>

      {todayEntry && !editingToday ? (
        <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Ya registraste tu gratitud de hoy.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
            <li>{todayEntry.entry_1}</li>
            {todayEntry.entry_2 ? <li>{todayEntry.entry_2}</li> : null}
            {todayEntry.entry_3 ? <li>{todayEntry.entry_3}</li> : null}
          </ul>
          <button
            type="button"
            className="mt-3 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setEditingToday(true)}
          >
            Editar
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-emerald-200 bg-white p-4">
          <label className="block">
            <span className="text-sm font-semibold text-emerald-900">1. Algo lindo de hoy</span>
            <textarea
              value={entry1}
              onChange={(event) => setEntry1(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
              placeholder="Este campo es requerido"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-emerald-900">2. Otra cosa que agradeces</span>
            <textarea
              value={entry2}
              onChange={(event) => setEntry2(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-emerald-900">3. Una más para cerrar el día</span>
            <textarea
              value={entry3}
              onChange={(event) => setEntry3(event.target.value)}
              className="mt-2 min-h-20 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </label>

          <button
            type="button"
            disabled={saving || !entry1.trim()}
            onClick={() => {
              void saveGratitude()
            }}
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar gratitud (+3 puntos)'}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {successMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{successMessage}</p> : null}

      <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Historial</h2>
        {items.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Sin entradas todavía" description="Tu historial aparecerá aquí." />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">{item.logged_date}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-950">
                  <li>{item.entry_1}</li>
                  {item.entry_2 ? <li>{item.entry_2}</li> : null}
                  {item.entry_3 ? <li>{item.entry_3}</li> : null}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
