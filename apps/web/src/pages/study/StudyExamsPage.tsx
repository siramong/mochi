import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { ExamLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

type ExamFormState = {
  subject: string
  grade: string
  max_grade: string
  exam_date: string
  notes: string
}

const initialState: ExamFormState = {
  subject: '',
  grade: '',
  max_grade: '10',
  exam_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export function StudyExamsPage() {
  const { session } = useSession()
  const [form, setForm] = useState<ExamFormState>(initialState)
  const [rows, setRows] = useState<ExamLog[]>([])
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
      const { data, error: examsError } = await supabase
        .from('exam_logs')
        .select('*')
        .eq('user_id', userId)
        .order('exam_date', { ascending: false })
        .returns<ExamLog[]>()

      if (examsError) {
        setError(examsError.message)
      } else {
        setRows(data ?? [])
      }

      setLoading(false)
    }

    void loadExams()
  }, [session?.user.id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      setForm(initialState)
    }

    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Registro de exámenes</h1>

      <form className="mt-5 grid gap-3 rounded-3xl border border-pink-200 bg-pink-50 p-4 md:grid-cols-5" onSubmit={(event) => { void handleSubmit(event) }}>
        <input
          required
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          className="rounded-xl border border-pink-200 px-3 py-2 text-sm"
          placeholder="Materia"
        />
        <input
          required
          type="number"
          step="0.1"
          value={form.grade}
          onChange={(event) => setForm((prev) => ({ ...prev, grade: event.target.value }))}
          className="rounded-xl border border-pink-200 px-3 py-2 text-sm"
          placeholder="Nota"
        />
        <input
          required
          type="number"
          step="0.1"
          value={form.max_grade}
          onChange={(event) => setForm((prev) => ({ ...prev, max_grade: event.target.value }))}
          className="rounded-xl border border-pink-200 px-3 py-2 text-sm"
          placeholder="Máxima"
        />
        <input
          required
          type="date"
          value={form.exam_date}
          onChange={(event) => setForm((prev) => ({ ...prev, exam_date: event.target.value }))}
          className="rounded-xl border border-pink-200 px-3 py-2 text-sm"
        />
        <button
          disabled={saving}
          type="submit"
          className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-70"
        >
          {saving ? 'Guardando...' : 'Agregar'}
        </button>

        <input
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          className="md:col-span-5 rounded-xl border border-pink-200 px-3 py-2 text-sm"
          placeholder="Notas opcionales"
        />
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading && <p className="mt-4 text-sm text-purple-700">Cargando exámenes...</p>}

      {!loading && rows.length === 0 && (
        <div className="mt-4">
          <EmptyState title="No hay exámenes todavía" description="Registra tus notas para visualizar tu progreso académico." />
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-4 space-y-3">
          {rows.map((item) => {
            const percent = item.max_grade > 0 ? Math.round((item.grade / item.max_grade) * 100) : 0

            return (
              <article key={item.id} className="rounded-2xl border border-pink-100 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-purple-950">{item.subject}</p>
                  <span className="rounded-full bg-pink-100 px-2 py-1 text-xs font-bold text-pink-800">
                    {item.grade}/{item.max_grade} ({percent}%)
                  </span>
                </div>
                <p className="mt-1 text-xs text-purple-700">Fecha: {item.exam_date}</p>
                {item.notes ? <p className="mt-1 text-sm text-purple-900">{item.notes}</p> : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
