import { FormEvent, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { addPoints, unlockAchievement } from '@/lib/gamification'
import type { ExamLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

type Tab = 'results' | 'upcoming'

type ExamFormState = {
  subject: string
  grade: string
  max_grade: string
  exam_date: string
  notes: string
}

type UpcomingExamState = {
  subject: string
  exam_date: string
  preparation_notes: string
}

const initialResultState: ExamFormState = {
  subject: '',
  grade: '',
  max_grade: '10',
  exam_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

const initialUpcomingState: UpcomingExamState = {
  subject: '',
  exam_date: '',
  preparation_notes: '',
}

export function StudyExamsPage() {
  const { session } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'upcoming' ? 'upcoming' : 'results')
  const [form, setForm] = useState<ExamFormState>(initialResultState)
  const [upcomingForm, setUpcomingForm] = useState<UpcomingExamState>(initialUpcomingState)
  const [rows, setRows] = useState<ExamLog[]>([])
  const [upcomingRows, setUpcomingRows] = useState<ExamLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadExams() {
      setLoading(true)

      const [resultsRes, upcomingRes] = await Promise.all([
        supabase
          .from('exam_logs')
          .select('*')
          .eq('user_id', userId)
          .or('is_upcoming.is.false,is_upcoming.is.null')
          .order('exam_date', { ascending: false })
          .returns<ExamLog[]>(),
        supabase
          .from('exam_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('is_upcoming', true)
          .order('exam_date', { ascending: true })
          .returns<ExamLog[]>(),
      ])

      if (resultsRes.error || upcomingRes.error) {
        setError(resultsRes.error?.message ?? upcomingRes.error?.message ?? 'No se pudo cargar exámenes')
      } else {
        setRows(resultsRes.data ?? [])
        setUpcomingRows(upcomingRes.data ?? [])
      }

      setLoading(false)
    }

    void loadExams()
  }, [session?.user.id, saving])

  const handleSubmitResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const userId = session?.user.id
    if (!userId) return

    setSaving(true)
    setError(null)

    const payload = {
      user_id: userId,
      subject: form.subject,
      grade: Number(form.grade),
      max_grade: Number(form.max_grade),
      exam_date: form.exam_date,
      notes: form.notes.trim() || null,
      is_upcoming: false,
    }

    const { data, error: insertError } = await supabase
      .from('exam_logs')
      .insert(payload)
      .select('*')
      .single<ExamLog>()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      setRows((prev) => [data, ...prev])
      setForm(initialResultState)

      const percentage = (Number(form.grade) / Number(form.max_grade)) * 100
      if (percentage >= 70) {
        await addPoints(userId, 20)
        await unlockAchievement(userId, 'exam_ace')
      }
    }

    setSaving(false)
  }

  const handleSubmitUpcoming = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const userId = session?.user.id
    if (!userId) return

    setSaving(true)
    setError(null)

    const payload = {
      user_id: userId,
      subject: upcomingForm.subject,
      exam_date: upcomingForm.exam_date,
      preparation_notes: upcomingForm.preparation_notes.trim() || null,
      grade: null,
      max_grade: null,
      notes: null,
      is_upcoming: true,
    }

    const { data, error: insertError } = await supabase
      .from('exam_logs')
      .insert(payload)
      .select('*')
      .single<ExamLog>()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      setUpcomingRows((prev) => [...prev, data].sort((a, b) => a.exam_date.localeCompare(b.exam_date)))
      setUpcomingForm(initialUpcomingState)
    }

    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Registro de exámenes</h1>

      <div className="mt-4 flex w-full max-w-md rounded-2xl border border-pink-200 bg-white p-1">
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'results' ? 'bg-pink-500 text-white' : 'text-pink-700'}`}
          onClick={() => {
            setTab('results')
            setSearchParams({ tab: 'results' })
          }}
        >
          Registrar resultado
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold ${tab === 'upcoming' ? 'bg-pink-500 text-white' : 'text-pink-700'}`}
          onClick={() => {
            setTab('upcoming')
            setSearchParams({ tab: 'upcoming' })
          }}
        >
          Próximos exámenes
        </button>
      </div>

      {tab === 'results' ? (
        <form className="mt-5 grid gap-3 rounded-3xl border border-pink-200 bg-pink-50 p-4 md:grid-cols-5" onSubmit={(event) => { void handleSubmitResult(event) }}>
          <input required value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} className="rounded-xl border border-pink-200 px-3 py-2 text-sm" placeholder="Materia" />
          <input required type="number" step="0.1" value={form.grade} onChange={(event) => setForm((prev) => ({ ...prev, grade: event.target.value }))} className="rounded-xl border border-pink-200 px-3 py-2 text-sm" placeholder="Nota" />
          <input required type="number" step="0.1" value={form.max_grade} onChange={(event) => setForm((prev) => ({ ...prev, max_grade: event.target.value }))} className="rounded-xl border border-pink-200 px-3 py-2 text-sm" placeholder="Máxima" />
          <input required type="date" value={form.exam_date} onChange={(event) => setForm((prev) => ({ ...prev, exam_date: event.target.value }))} className="rounded-xl border border-pink-200 px-3 py-2 text-sm" />
          <button disabled={saving} type="submit" className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-70">{saving ? 'Guardando...' : 'Agregar'}</button>
          <input value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} className="md:col-span-5 rounded-xl border border-pink-200 px-3 py-2 text-sm" placeholder="Notas opcionales" />
        </form>
      ) : (
        <form className="mt-5 grid gap-3 rounded-3xl border border-yellow-200 bg-yellow-50 p-4 md:grid-cols-4" onSubmit={(event) => { void handleSubmitUpcoming(event) }}>
          <input required value={upcomingForm.subject} onChange={(event) => setUpcomingForm((prev) => ({ ...prev, subject: event.target.value }))} className="rounded-xl border border-yellow-200 px-3 py-2 text-sm" placeholder="Materia" />
          <input required type="date" value={upcomingForm.exam_date} onChange={(event) => setUpcomingForm((prev) => ({ ...prev, exam_date: event.target.value }))} className="rounded-xl border border-yellow-200 px-3 py-2 text-sm" />
          <input value={upcomingForm.preparation_notes} onChange={(event) => setUpcomingForm((prev) => ({ ...prev, preparation_notes: event.target.value }))} className="rounded-xl border border-yellow-200 px-3 py-2 text-sm" placeholder="Notas de preparación" />
          <button disabled={saving} type="submit" className="rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-70">{saving ? 'Guardando...' : 'Guardar próximo'}</button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading && <p className="mt-4 text-sm text-purple-700">Cargando exámenes...</p>}

      {!loading && tab === 'results' && rows.length === 0 && (
        <div className="mt-4">
          <EmptyState title="No hay exámenes todavía" description="Registra tus notas para visualizar tu progreso académico." />
        </div>
      )}

      {!loading && tab === 'results' && rows.length > 0 && (
        <div className="mt-4 space-y-3">
          {rows.map((item) => {
            const grade = item.grade ?? 0
            const maxGrade = item.max_grade ?? 10
            const percent = maxGrade > 0 ? Math.round((grade / maxGrade) * 100) : 0

            return (
              <article key={item.id} className="rounded-2xl border border-pink-100 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-purple-950">{item.subject}</p>
                  <span className="rounded-full bg-pink-100 px-2 py-1 text-xs font-bold text-pink-800">
                    {grade}/{maxGrade} ({percent}%)
                  </span>
                </div>
                <p className="mt-1 text-xs text-purple-700">Fecha: {item.exam_date}</p>
                {item.notes ? <p className="mt-1 text-sm text-purple-900">{item.notes}</p> : null}
              </article>
            )
          })}
        </div>
      )}

      {!loading && tab === 'upcoming' && upcomingRows.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No hay próximos exámenes" description="Agrega una fecha futura y Mochi te ayudará con el countdown." />
        </div>
      ) : null}

      {!loading && tab === 'upcoming' && upcomingRows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {upcomingRows.map((item) => {
            const now = new Date().toISOString().slice(0, 10)
            const days = Math.round((new Date(`${item.exam_date}T00:00:00`).getTime() - new Date(`${now}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24))
            const badgeClass = days <= 1 ? 'bg-red-100 text-red-700' : days <= 3 ? 'bg-orange-100 text-orange-700' : days <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-700'

            return (
              <article key={item.id} className="rounded-2xl border border-yellow-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-yellow-900">{item.subject}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${badgeClass}`}>
                    {days <= 0 ? '¡Hoy!' : `En ${days} días`}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-yellow-700">Fecha: {item.exam_date}</p>
                {item.preparation_notes ? <p className="mt-1 text-sm text-yellow-900">{item.preparation_notes}</p> : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
