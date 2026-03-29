import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { useCyclePhase } from '@/hooks/useCyclePhase'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'
import type { Exercise, Routine } from '@/types/database'

type RoutineWithCount = Routine & { exerciseCount: number }

const routineDayOptions: Array<{ value: number; label: string }> = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
]

export function ExercisePage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [routines, setRoutines] = useState<RoutineWithCount[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showRoutineModal, setShowRoutineModal] = useState(false)

  const [exerciseName, setExerciseName] = useState('')
  const [exerciseSets, setExerciseSets] = useState(3)
  const [exerciseReps, setExerciseReps] = useState(10)
  const [exerciseSeconds, setExerciseSeconds] = useState(60)
  const [exerciseNotes, setExerciseNotes] = useState('')

  const [routineName, setRoutineName] = useState('')
  const [routineDays, setRoutineDays] = useState<Set<number>>(new Set([1, 3, 5]))
  const [routineExerciseIds, setRoutineExerciseIds] = useState<Set<string>>(new Set())

  const [saving, setSaving] = useState(false)
  const { phase } = useCyclePhase()

  const loadExerciseModule = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [routinesRes, exercisesRes, routineExercisesRes] = await Promise.allSettled([
        supabase.from('routines').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Routine[]>(),
        supabase.from('exercises').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Exercise[]>(),
        supabase.from('routine_exercises').select('routine_id').returns<Array<{ routine_id: string }>>(),
      ])

      const routinesError =
        routinesRes.status === 'rejected'
          ? true
          : !!routinesRes.value.error
      const exercisesError =
        exercisesRes.status === 'rejected'
          ? true
          : !!exercisesRes.value.error
      const routineExercisesError =
        routineExercisesRes.status === 'rejected'
          ? true
          : !!routineExercisesRes.value.error

      if (routinesError || exercisesError || routineExercisesError) {
        setError('No se pudo cargar el módulo de ejercicio')
      }

      const exerciseCountByRoutine = new Map<string, number>()
      const routineExerciseRows =
        routineExercisesRes.status === 'fulfilled' && !routineExercisesRes.value.error
          ? (routineExercisesRes.value.data ?? [])
          : []

      for (const row of routineExerciseRows) {
        exerciseCountByRoutine.set(row.routine_id, (exerciseCountByRoutine.get(row.routine_id) ?? 0) + 1)
      }

      const routineRows =
        routinesRes.status === 'fulfilled' && !routinesRes.value.error
          ? (routinesRes.value.data ?? [])
          : []

      const exerciseRows =
        exercisesRes.status === 'fulfilled' && !exercisesRes.value.error
          ? (exercisesRes.value.data ?? [])
          : []

      setRoutines(
        routineRows.map((routine) => ({
          ...routine,
          exerciseCount: exerciseCountByRoutine.get(routine.id) ?? 0,
        }))
      )
      setExercises(exerciseRows)
    } catch (loadError) {
      console.error('Error inesperado cargando ejercicio:', loadError)
      setError('No se pudo cargar el módulo de ejercicio')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadExerciseModule()
  }, [loadExerciseModule])

  const createExercise = async () => {
    if (!userId || !exerciseName.trim()) return

    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('exercises').insert({
      user_id: userId,
      name: exerciseName.trim(),
      sets: Math.max(1, exerciseSets),
      reps: Math.max(1, exerciseReps),
      duration_seconds: Math.max(1, exerciseSeconds),
      notes: exerciseNotes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setExerciseName('')
    setExerciseSets(3)
    setExerciseReps(10)
    setExerciseSeconds(60)
    setExerciseNotes('')
    setShowExerciseModal(false)
    await loadExerciseModule()
    setSaving(false)
  }

  const deleteExercise = async (exerciseId: string) => {
    const confirmed = window.confirm('¿Eliminar este ejercicio?')
    if (!confirmed) return

    const { error: deleteError } = await supabase.from('exercises').delete().eq('id', exerciseId).eq('user_id', userId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await loadExerciseModule()
  }

  const createRoutine = async () => {
    if (!userId || !routineName.trim()) return

    setSaving(true)
    setError(null)

    const sortedDays = [...routineDays].sort((a, b) => a - b)

    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: routineName.trim(),
        days: sortedDays,
      })
      .select('id')
      .single<{ id: string }>()

    if (routineError) {
      setError(routineError.message)
      setSaving(false)
      return
    }

    const selectedIds = [...routineExerciseIds]
    if (selectedIds.length > 0) {
      const { error: relationError } = await supabase.from('routine_exercises').insert(
        selectedIds.map((exerciseId, index) => ({
          routine_id: routineData.id,
          exercise_id: exerciseId,
          order_index: index,
        }))
      )

      if (relationError) {
        setError(relationError.message)
        setSaving(false)
        return
      }
    }

    setRoutineName('')
    setRoutineDays(new Set([1, 3, 5]))
    setRoutineExerciseIds(new Set())
    setShowRoutineModal(false)
    await loadExerciseModule()
    setSaving(false)
  }

  const deleteRoutine = async (routineId: string) => {
    const confirmed = window.confirm('¿Eliminar esta rutina?')
    if (!confirmed) return

    const { error: deleteError } = await supabase.from('routines').delete().eq('id', routineId).eq('user_id', userId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await loadExerciseModule()
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Rutinas y ejercicios</h1>
      <p className="mt-1 text-sm text-purple-700">Gestiona tus ejercicios y crea rutinas simples desde web</p>

      <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50 p-3">
        <p className="text-xs font-bold uppercase text-teal-700">Intensidad sugerida</p>
        <p className="text-sm font-semibold text-teal-900">
          {phase === 'menstrual'
            ? 'Hoy conviene intensidad baja y movilidad suave.'
            : phase === 'ovulatoria'
              ? 'Hoy puedes probar una rutina intensa si te sientes bien.'
              : 'Mantén una intensidad media y constante.'}
        </p>
      </div>

      {loading ? <p className="mt-4 text-sm text-purple-700">Cargando módulo...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && routines.length === 0 && exercises.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Sin rutinas todavía" description="Crea tu primer ejercicio para empezar." />
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-teal-950">Mis ejercicios ({exercises.length})</h2>
              <button
                type="button"
                className="rounded-xl bg-teal-500 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setShowExerciseModal(true)}
              >
                Nuevo ejercicio
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {exercises.map((exercise) => (
                <article key={exercise.id} className="rounded-2xl border border-teal-100 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-teal-900">{exercise.name}</p>
                      <p className="text-xs text-teal-700">
                        {exercise.sets} series • {exercise.reps} reps • {exercise.duration_seconds}s
                      </p>
                      {exercise.notes ? <p className="mt-1 text-xs text-teal-800">{exercise.notes}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600"
                      onClick={() => {
                        void deleteExercise(exercise.id)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-emerald-950">Mis rutinas ({routines.length})</h2>
              <button
                type="button"
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setShowRoutineModal(true)}
              >
                Nueva rutina
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {routines.map((routine) => (
                <article key={routine.id} className="rounded-2xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-emerald-900">{routine.name}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {routineDayOptions.map((day) => {
                          const active = routine.days.includes(day.value)
                          return (
                            <span
                              key={`${routine.id}-${day.value}`}
                              className={[
                                'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                                active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500',
                              ].join(' ')}
                            >
                              {day.label}
                            </span>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-emerald-700">
                        {routine.exerciseCount} {routine.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600"
                      onClick={() => {
                        void deleteRoutine(routine.id)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {showExerciseModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-teal-950">Nuevo ejercicio</h3>

            <label className="mt-3 block">
              <span className="text-sm font-semibold text-teal-900">Nombre</span>
              <input
                value={exerciseName}
                onChange={(event) => setExerciseName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-teal-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="font-semibold text-teal-900">Series</span>
                <input
                  type="number"
                  min={1}
                  value={exerciseSets}
                  onChange={(event) => setExerciseSets(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-teal-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-teal-900">Repeticiones</span>
                <input
                  type="number"
                  min={1}
                  value={exerciseReps}
                  onChange={(event) => setExerciseReps(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-teal-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold text-teal-900">Segundos</span>
                <input
                  type="number"
                  min={1}
                  value={exerciseSeconds}
                  onChange={(event) => setExerciseSeconds(Number(event.target.value))}
                  className="mt-1 w-full rounded-xl border border-teal-200 px-3 py-2"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-sm font-semibold text-teal-900">Notas</span>
              <textarea
                value={exerciseNotes}
                onChange={(event) => setExerciseNotes(event.target.value)}
                className="mt-2 min-h-20 w-full rounded-xl border border-teal-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-900"
                onClick={() => setShowExerciseModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || !exerciseName.trim()}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => {
                  void createExercise()
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRoutineModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-emerald-950">Nueva rutina</h3>

            <label className="mt-3 block">
              <span className="text-sm font-semibold text-emerald-900">Nombre</span>
              <input
                value={routineName}
                onChange={(event) => setRoutineName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="mt-3">
              <p className="text-sm font-semibold text-emerald-900">Días</p>
              <div className="mt-2 flex items-center gap-1">
                {routineDayOptions.map((day) => {
                  const active = routineDays.has(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                        active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                      onClick={() => {
                        setRoutineDays((previous) => {
                          const next = new Set(previous)
                          if (next.has(day.value)) {
                            next.delete(day.value)
                          } else {
                            next.add(day.value)
                          }
                          return next
                        })
                      }}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm font-semibold text-emerald-900">Ejercicios</p>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-emerald-200 p-2">
                {exercises.length === 0 ? (
                  <p className="text-xs text-slate-600">Crea ejercicios primero para agregarlos a la rutina.</p>
                ) : (
                  exercises.map((exercise) => (
                    <label key={exercise.id} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-sm text-emerald-900">
                      <input
                        type="checkbox"
                        checked={routineExerciseIds.has(exercise.id)}
                        onChange={(event) => {
                          const checked = event.target.checked
                          setRoutineExerciseIds((previous) => {
                            const next = new Set(previous)
                            if (checked) {
                              next.add(exercise.id)
                            } else {
                              next.delete(exercise.id)
                            }
                            return next
                          })
                        }}
                      />
                      {exercise.name}
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900"
                onClick={() => setShowRoutineModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || !routineName.trim()}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => {
                  void createRoutine()
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
