import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStudyBlocks } from '@/hooks/useStudyBlocks'
import { EmptyState } from '@/components/common/EmptyState'

const days = [
  { label: 'Dom', value: 0 },
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
]

const colorMap: Record<string, string> = {
  pink: 'bg-pink-100 border-pink-200',
  blue: 'bg-blue-100 border-blue-200',
  yellow: 'bg-yellow-100 border-yellow-200',
  teal: 'bg-teal-100 border-teal-200',
  purple: 'bg-purple-100 border-purple-200',
  green: 'bg-green-100 border-green-200',
}

export function StudyPage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const { blocks, loading, error, deleteBlock } = useStudyBlocks(selectedDay)

  const dayLabel = useMemo(
    () => days.find((day) => day.value === selectedDay)?.label ?? 'Día',
    [selectedDay],
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Horario de estudio</h1>
          <p className="text-sm text-purple-700">Planifica por día y edita bloques rápido</p>
        </div>
        <Link
          to="/study/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo bloque
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => setSelectedDay(day.value)}
            className={[
              'rounded-xl px-3 py-2 text-sm font-bold transition-colors',
              selectedDay === day.value
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 text-purple-900 hover:bg-purple-200',
            ].join(' ')}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Bloques de {dayLabel}</h2>

        {loading && <p className="mt-3 text-sm text-purple-700">Cargando bloques...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {!loading && !error && blocks.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No hay bloques para este día"
              description="Crea tu primer bloque para empezar una semana más clara y organizada."
            />
          </div>
        )}

        <div className="mt-4 space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={[
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3',
                colorMap[block.color] ?? 'bg-slate-100 border-slate-200',
              ].join(' ')}
            >
              <div>
                <p className="text-sm font-extrabold text-slate-900">{block.subject}</p>
                <p className="text-xs font-semibold text-slate-700">
                  {block.start_time} - {block.end_time}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/study/${block.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-xs font-semibold text-purple-800"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-xs font-semibold text-red-700"
                  onClick={() => {
                    void deleteBlock(block.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
