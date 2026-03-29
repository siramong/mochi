import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStudyBlocks, type NewStudyBlock } from '@/hooks/useStudyBlocks'
import { useSession } from '@/hooks/useSession'
import type { StudyBlock } from '@/types/database'

const initialForm: NewStudyBlock = {
  subject: '',
  day_of_week: 1,
  start_time: '07:00',
  end_time: '08:30',
  color: 'purple',
}

const colors = ['pink', 'blue', 'yellow', 'teal', 'purple', 'green']

function toMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(':').map(Number)
  return hours * 60 + minutes
}

export function StudyFormPage() {
  const navigate = useNavigate()
  const { blockId } = useParams()
  const isEdit = Boolean(blockId)
  const { session } = useSession()
  const { createBlock, updateBlock } = useStudyBlocks()

  const [form, setForm] = useState<NewStudyBlock>(initialForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id

    if (!isEdit || !blockId || !userId) {
      setLoading(false)
      return
    }

    async function loadBlock() {
      setLoading(true)
      const { data, error: blockError } = await supabase
        .from('study_blocks')
        .select('*')
        .eq('id', blockId)
        .eq('user_id', userId)
        .maybeSingle<StudyBlock>()

      if (blockError) {
        setError(blockError.message)
      } else if (data) {
        setForm({
          subject: data.subject,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          color: data.color,
        })
      }

      setLoading(false)
    }

    void loadBlock()
  }, [isEdit, blockId, session?.user.id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (toMinutes(form.end_time) <= toMinutes(form.start_time)) {
      setError('La hora de fin debe ser mayor que la hora de inicio')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEdit && blockId) {
        await updateBlock(blockId, form)
      } else {
        await createBlock(form)
      }

      navigate('/study')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el bloque')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm font-semibold text-purple-700">Cargando formulario...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">
        {isEdit ? 'Editar bloque de estudio' : 'Nuevo bloque de estudio'}
      </h1>
      <p className="mt-1 text-sm text-purple-700">Define materia, horario y color de referencia</p>

      <form className="mt-6 space-y-4 rounded-3xl border border-purple-200 bg-white p-5" onSubmit={(event) => { void handleSubmit(event) }}>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-purple-800">Materia</span>
          <input
            required
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
            placeholder="Ej: Matemáticas"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase text-purple-800">Día</span>
            <select
              value={form.day_of_week}
              onChange={(event) => setForm((prev) => ({ ...prev, day_of_week: Number(event.target.value) }))}
              className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
            >
              <option value={1}>Lunes</option>
              <option value={2}>Martes</option>
              <option value={3}>Miércoles</option>
              <option value={4}>Jueves</option>
              <option value={5}>Viernes</option>
              <option value={6}>Sábado</option>
              <option value={0}>Domingo</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase text-purple-800">Inicio</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))}
              className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase text-purple-800">Fin</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))}
              className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-purple-800">Color</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color }))}
                className={[
                  'rounded-xl px-3 py-1 text-xs font-bold capitalize',
                  form.color === color
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-100 text-purple-800',
                ].join(' ')}
              >
                {color}
              </button>
            ))}
          </div>
        </label>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            disabled={saving}
            type="submit"
            className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-70"
          >
            {saving ? 'Guardando...' : isEdit ? 'Actualizar bloque' : 'Crear bloque'}
          </button>
          <Link to="/study" className="rounded-2xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-900">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
