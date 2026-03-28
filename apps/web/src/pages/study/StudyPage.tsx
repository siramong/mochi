import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Hourglass, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStudyBlocks } from '@/hooks/useStudyBlocks'
import { EmptyState } from '@/components/common/EmptyState'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

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
  const { blocks, loading, error, deleteBlock } = useStudyBlocks()
  const { session } = useSession()
  const [upcomingExams, setUpcomingExams] = useState<Array<{ id: string; subject: string; exam_date: string }>>([])
  const [loadingUpcomingExams, setLoadingUpcomingExams] = useState(false)
  const [upcomingExamsError, setUpcomingExamsError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setUpcomingExams([])
      setLoadingUpcomingExams(false)
      setUpcomingExamsError(null)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    async function loadExams() {
      setLoadingUpcomingExams(true)
      setUpcomingExamsError(null)

      const { data, error } = await supabase
        .from('exam_logs')
        .select('id, subject, exam_date')
        .eq('user_id', userId)
        .eq('is_upcoming', true)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true })
        .limit(6)

      if (error) {
        setUpcomingExamsError(error.message)
        setUpcomingExams([])
      } else {
        setUpcomingExams((data as Array<{ id: string; subject: string; exam_date: string }> | null) ?? [])
      }

      setLoadingUpcomingExams(false)
    }

    void loadExams()
  }, [session?.user.id])

  const weeklyGroups = useMemo(() => {
    const map = new Map<number, typeof blocks>()

    days.forEach((day) => {
      map.set(day.value, [])
    })

    blocks.forEach((block) => {
      const current = map.get(block.day_of_week) ?? []
      current.push(block)
      current.sort((a, b) => a.start_time.localeCompare(b.start_time))
      map.set(block.day_of_week, current)
    })

    return map
  }, [blocks])

  const handleDeleteBlock = async (blockId: string) => {
    const shouldDelete = window.confirm('¿Seguro que quieres borrar este bloque de estudio? Esta acción no se puede deshacer.')
    if (!shouldDelete) return

    try {
      setDeleteError(null)
      await deleteBlock(blockId)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el bloque de estudio')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Horario de estudio</h1>
          <p className="text-sm text-purple-700">Planifica tu semana completa y activa enfoque desde PC</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/study/timer"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <Hourglass className="h-4 w-4" />
            Modo enfoque
          </Link>
          <Link
            to="/study/history"
            className="rounded-2xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-900"
          >
            Historial
          </Link>
          <Link
            to="/study/exams"
            className="rounded-2xl bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-900"
          >
            Exámenes
          </Link>
          <Link
            to="/study/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
          >
            <Plus className="h-4 w-4" />
            Nuevo bloque
          </Link>
        </div>
      </div>

      {loadingUpcomingExams || upcomingExamsError || upcomingExams.length > 0 ? (
        <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-yellow-900">Próximos exámenes</h2>
            <Link to="/study/exams?tab=upcoming" className="text-xs font-bold text-yellow-800">Registrar examen próximo</Link>
          </div>
          {loadingUpcomingExams ? <p className="mt-3 text-sm font-semibold text-yellow-800">Cargando próximos exámenes...</p> : null}
          {upcomingExamsError ? <p className="mt-3 text-sm font-semibold text-red-600">No se pudieron cargar los próximos exámenes: {upcomingExamsError}</p> : null}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {upcomingExams.map((exam) => {
              const now = new Date().toISOString().slice(0, 10)
              const days = Math.round((new Date(`${exam.exam_date}T00:00:00`).getTime() - new Date(`${now}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24))
              const badgeClass = days <= 1 ? 'bg-red-100 text-red-700' : days <= 3 ? 'bg-orange-100 text-orange-700' : days <= 7 ? 'bg-yellow-200 text-yellow-900' : 'bg-emerald-100 text-emerald-700'

              return (
                <div key={exam.id} className="min-w-[210px] rounded-2xl border border-yellow-200 bg-white p-3">
                  <p className="text-sm font-extrabold text-yellow-900">{exam.subject}</p>
                  <p className="mt-1 text-xs font-semibold text-yellow-700">{exam.exam_date}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold ${badgeClass}`}>
                    {days <= 0 ? '¡Hoy!' : `En ${days} días`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Vista semanal</h2>

        {loading && <p className="mt-3 text-sm text-purple-700">Cargando bloques...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}

        {!loading && !error && blocks.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="Aún no tienes bloques de estudio"
              description="Crea tu primer bloque y convierte la semana en un plan claro desde la compu."
            />
          </div>
        )}

        {!loading && !error && blocks.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {days.map((day) => {
              const dayBlocks = weeklyGroups.get(day.value) ?? []

              return (
                <div key={day.value} className="rounded-2xl border border-purple-100 bg-purple-50/70 p-3">
                  <p className="text-sm font-extrabold text-purple-900">{day.label}</p>

                  <div className="mt-2 space-y-2">
                    {dayBlocks.length === 0 ? (
                      <p className="text-xs font-semibold text-purple-400">Sin bloques</p>
                    ) : (
                      dayBlocks.map((block) => (
                        <article
                          key={block.id}
                          className={[
                            'rounded-xl border p-2',
                            colorMap[block.color] ?? 'bg-slate-100 border-slate-200',
                          ].join(' ')}
                        >
                          <p className="text-xs font-extrabold text-slate-900">{block.subject}</p>
                          <p className="text-[11px] font-semibold text-slate-700">
                            {block.start_time} - {block.end_time}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1">
                            <Link
                              to={`/study/timer?blockId=${block.id}`}
                              className="rounded-lg bg-blue-500 px-2 py-1 text-[11px] font-bold text-white"
                            >
                              Enfoque
                            </Link>
                            <Link
                              to={`/study/${block.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-purple-800"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </Link>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-red-700"
                              onClick={() => {
                                void handleDeleteBlock(block.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                              Borrar
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
