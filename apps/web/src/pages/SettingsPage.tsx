import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { useUserSettings } from '@/hooks/useUserSettings'

type FormSettings = {
  full_name: string
  wake_up_time: string
  study_enabled: boolean
  exercise_enabled: boolean
  habits_enabled: boolean
  goals_enabled: boolean
  mood_enabled: boolean
  gratitude_enabled: boolean
  cooking_enabled: boolean
  notes_enabled: boolean
}

type CycleForm = {
  period_start_date: string
  period_end_date: string
  cycle_length_days: string
  notes: string
}

const defaultForm: FormSettings = {
  full_name: '',
  wake_up_time: '05:20',
  study_enabled: true,
  exercise_enabled: true,
  habits_enabled: true,
  goals_enabled: true,
  mood_enabled: true,
  gratitude_enabled: true,
  cooking_enabled: true,
  notes_enabled: true,
}

export function SettingsPage() {
  const { session } = useSession()
  const { settings, refresh } = useUserSettings()
  const [form, setForm] = useState<FormSettings>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [cycleForm, setCycleForm] = useState<CycleForm>({
    period_start_date: '',
    period_end_date: '',
    cycle_length_days: '28',
    notes: '',
  })
  const [cycleHistory, setCycleHistory] = useState<Array<{ id: string; period_start_date: string; period_end_date: string | null }>>([])

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    async function loadBaseData() {
      const profileRes = await supabase
        .from('profiles')
        .select('full_name, wake_up_time')
        .eq('id', userId)
        .maybeSingle<{ full_name: string | null; wake_up_time: string | null }>()

      setForm((prev) => ({
        ...prev,
        full_name: profileRes.data?.full_name ?? '',
        wake_up_time: profileRes.data?.wake_up_time ?? '05:20',
        study_enabled: settings?.study_enabled ?? true,
        exercise_enabled: settings?.exercise_enabled ?? true,
        habits_enabled: settings?.habits_enabled ?? true,
        goals_enabled: settings?.goals_enabled ?? true,
        mood_enabled: settings?.mood_enabled ?? true,
        gratitude_enabled: settings?.gratitude_enabled ?? true,
        cooking_enabled: settings?.cooking_enabled ?? true,
        notes_enabled: settings?.notes_enabled ?? true,
      }))

      const cycleRes = await supabase
        .from('cycle_logs')
        .select('id, period_start_date, period_end_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      setCycleHistory((cycleRes.data as Array<{ id: string; period_start_date: string; period_end_date: string | null }> | null) ?? [])
    }

    void loadBaseData()
  }, [session?.user.id, settings])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const userId = session?.user.id
    if (!userId) return

    setSaving(true)
    setMessage(null)

    const [profileRes, settingsRes] = await Promise.all([
      supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          wake_up_time: form.wake_up_time,
        })
        .eq('id', userId),
      supabase.from('user_settings').upsert({
        user_id: userId,
        study_enabled: form.study_enabled,
        exercise_enabled: form.exercise_enabled,
        habits_enabled: form.habits_enabled,
        goals_enabled: form.goals_enabled,
        mood_enabled: form.mood_enabled,
        gratitude_enabled: form.gratitude_enabled,
        cooking_enabled: form.cooking_enabled,
        notes_enabled: form.notes_enabled,
      }),
    ])

    if (profileRes.error || settingsRes.error) {
      setMessage('No se pudieron guardar los cambios')
    } else {
      setMessage('Cambios guardados correctamente')
      await refresh()
    }

    setSaving(false)
  }

  const moduleToggles: Array<{ key: keyof FormSettings; label: string }> = [
    { key: 'study_enabled', label: 'Estudio' },
    { key: 'exercise_enabled', label: 'Ejercicio' },
    { key: 'habits_enabled', label: 'Hábitos' },
    { key: 'goals_enabled', label: 'Metas' },
    { key: 'mood_enabled', label: 'Estado de ánimo' },
    { key: 'gratitude_enabled', label: 'Gratitud' },
    { key: 'cooking_enabled', label: 'Cocina' },
    { key: 'notes_enabled', label: 'Notas rápidas' },
  ]

  const handleSaveCycle = async () => {
    const userId = session?.user.id
    if (!userId || !cycleForm.period_start_date) return

    await supabase.from('cycle_logs').insert({
      user_id: userId,
      period_start_date: cycleForm.period_start_date,
      period_end_date: cycleForm.period_end_date || null,
      cycle_length_days: Number(cycleForm.cycle_length_days) || 28,
      notes: cycleForm.notes.trim() || null,
    })

    const cycleRes = await supabase
      .from('cycle_logs')
      .select('id, period_start_date, period_end_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    setCycleHistory((cycleRes.data as Array<{ id: string; period_start_date: string; period_end_date: string | null }> | null) ?? [])
    setCycleForm({ period_start_date: '', period_end_date: '', cycle_length_days: '28', notes: '' })
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Ajustes</h1>

      <form className="mt-5 space-y-5 rounded-3xl border border-purple-200 bg-white p-5" onSubmit={(event) => { void handleSubmit(event) }}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-purple-800">Nombre</span>
            <input
              value={form.full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              placeholder="Tu nombre"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-purple-800">Hora de despertar</span>
            <input
              type="time"
              value={form.wake_up_time}
              onChange={(event) => setForm((prev) => ({ ...prev, wake_up_time: event.target.value }))}
              className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-purple-800">Módulos activos</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {moduleToggles.map((item) => (
              <label key={item.key} className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-900">
                <input
                  type="checkbox"
                  checked={Boolean(form[item.key])}
                  onChange={(event) => {
                    const checked = event.target.checked
                    setForm((prev) => ({ ...prev, [item.key]: checked }))
                  }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {message ? <p className="text-sm font-semibold text-purple-700">{message}</p> : null}

        <button
          disabled={saving}
          type="submit"
          className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-70"
        >
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>
      </form>

      <section className="mt-5 rounded-3xl border border-rose-200 bg-white p-5">
        <h2 className="text-lg font-black text-rose-900">Seguimiento de ciclo</h2>
        <p className="mt-1 text-sm text-rose-700">
          Registra el inicio de tu período para que Mochi adapte sus recomendaciones.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-rose-800">Inicio del período</span>
            <input type="date" value={cycleForm.period_start_date} onChange={(e) => setCycleForm((prev) => ({ ...prev, period_start_date: e.target.value }))} className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-rose-800">Fin del período (opcional)</span>
            <input type="date" value={cycleForm.period_end_date} onChange={(e) => setCycleForm((prev) => ({ ...prev, period_end_date: e.target.value }))} className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-rose-800">Duración del ciclo</span>
            <input type="number" min={20} max={40} value={cycleForm.cycle_length_days} onChange={(e) => setCycleForm((prev) => ({ ...prev, cycle_length_days: e.target.value }))} className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase text-rose-800">Notas</span>
            <textarea value={cycleForm.notes} onChange={(e) => setCycleForm((prev) => ({ ...prev, notes: e.target.value }))} className="min-h-20 w-full rounded-xl border border-rose-200 px-3 py-2 text-sm" />
          </label>
        </div>

        <button type="button" className="mt-3 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={() => { void handleSaveCycle() }}>
          Guardar
        </button>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase text-rose-800">Últimos registros</p>
          {cycleHistory.map((item) => (
            <div key={item.id} className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900">
              {item.period_start_date} {item.period_end_date ? `→ ${item.period_end_date}` : '(sin fecha fin)'}
            </div>
          ))}
          {cycleHistory.length === 0 ? <p className="text-sm text-rose-600">Aún no hay registros.</p> : null}
        </div>
      </section>
    </div>
  )
}
