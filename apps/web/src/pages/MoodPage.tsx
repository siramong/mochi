import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { MoodLog } from '@/types/database'

type MoodOption = {
  value: 1 | 2 | 3 | 4 | 5
  label: string
  bgClass: string
  textClass: string
}

const moodOptions: MoodOption[] = [
  { value: 1, label: 'Mal', bgClass: 'bg-red-100 border-red-300', textClass: 'text-red-700' },
  { value: 2, label: 'Regular', bgClass: 'bg-orange-100 border-orange-300', textClass: 'text-orange-700' },
  { value: 3, label: 'Bien', bgClass: 'bg-yellow-100 border-yellow-300', textClass: 'text-yellow-700' },
  { value: 4, label: 'Muy bien', bgClass: 'bg-green-100 border-green-300', textClass: 'text-green-700' },
  { value: 5, label: 'Excelente', bgClass: 'bg-pink-100 border-pink-300', textClass: 'text-pink-700' },
]

const moodColorMap: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-400',
  5: 'bg-pink-400',
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function MoodPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [items, setItems] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingToday, setEditingToday] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const last7Days = useMemo(() => getLast7Days(), [])

  const loadMood = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false })
      .returns<MoodLog[]>()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setItems(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadMood()
  }, [loadMood])

  const todayEntry = useMemo(() => items.find((item) => item.logged_date === today) ?? null, [items, today])

  const historyMap = useMemo(() => {
    const map = new Map<string, MoodLog>()
    for (const item of items) {
      map.set(item.logged_date, item)
    }
    return map
  }, [items])

  useEffect(() => {
    if (!todayEntry || !editingToday) return
    setSelectedMood(todayEntry.mood as 1 | 2 | 3 | 4 | 5)
    setNote(todayEntry.note ?? '')
  }, [todayEntry, editingToday])

  const saveMood = async () => {
    if (!userId || !selectedMood) return

    setSaving(true)
    setError(null)

    const { error: saveError } = await supabase
      .from('mood_logs')
      .upsert(
        {
          user_id: userId,
          mood: selectedMood,
          note: note.trim() || null,
          logged_date: today,
        },
        { onConflict: 'user_id,logged_date' }
      )

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setEditingToday(false)
    setSelectedMood(null)
    setNote('')
    await loadMood()
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-purple-700">Cargando estado de ánimo...</p>

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Estado de ánimo</h1>
      <p className="mt-1 text-sm text-purple-700">Registra cómo te sentiste hoy y observa tu semana emocional.</p>

      {todayEntry && !editingToday ? (
        <div className="mt-4 rounded-3xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            Ya registraste tu ánimo hoy: {moodOptions.find((option) => option.value === todayEntry.mood)?.label ?? `Nivel ${todayEntry.mood}`}
            {todayEntry.note ? ` — ${todayEntry.note}` : ''}
          </p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => setEditingToday(true)}
          >
            Editar
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-rose-200 bg-white p-4">
          <p className="text-sm font-semibold text-rose-900">
            {todayEntry ? 'Actualiza tu registro de hoy' : '¿Cómo te sentiste hoy?'}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedMood(option.value)}
                className={[
                  'rounded-2xl border p-3 text-left transition',
                  option.bgClass,
                  selectedMood === option.value ? 'ring-2 ring-slate-800' : '',
                ].join(' ')}
              >
                <p className={[ 'text-sm font-bold', option.textClass ].join(' ')}>{option.label}</p>
              </button>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-rose-900">¿Qué te hizo sentir así hoy?</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm"
              placeholder="Opcional"
            />
          </label>

          <button
            type="button"
            disabled={!selectedMood || saving}
            className="mt-4 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={() => {
              void saveMood()
            }}
          >
            {saving ? 'Guardando...' : 'Guardar estado de ánimo'}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Últimos 7 días</h2>
        {items.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Sin registros aún" description="Tu histórico semanal aparecerá aquí." />
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex items-center justify-between">
              {last7Days.map((day) => {
                const item = historyMap.get(day)
                return (
                  <span
                    key={day}
                    title={
                      item
                        ? `${day}: ${moodOptions.find((option) => option.value === item.mood)?.label ?? `Nivel ${item.mood}`}${item.note ? ` — ${item.note}` : ''}`
                        : `${day}: Sin registro`
                    }
                    className={[
                      'h-5 w-5 rounded-full border',
                      item ? `${moodColorMap[item.mood]} border-transparent` : 'border-slate-300 bg-white',
                    ].join(' ')}
                  />
                )
              })}
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
