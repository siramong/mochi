import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Exercise, Routine } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function ExercisePage() {
  const { session } = useSession()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadExerciseModule() {
      setLoading(true)
      const [routinesRes, exercisesRes] = await Promise.all([
        supabase.from('routines').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Routine[]>(),
        supabase.from('exercises').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Exercise[]>(),
      ])

      if (routinesRes.error || exercisesRes.error) {
        setError('No se pudo cargar el módulo de ejercicio')
      } else {
        setRoutines(routinesRes.data ?? [])
        setExercises(exercisesRes.data ?? [])
      }

      setLoading(false)
    }

    void loadExerciseModule()
  }, [session?.user.id])

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Rutinas y ejercicios</h1>
      <p className="mt-1 text-sm text-purple-700">Visualiza y administra tu banco de ejercicios</p>

      {loading && <p className="mt-4 text-sm text-purple-700">Cargando módulo...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && routines.length === 0 && exercises.length === 0 && (
        <div className="mt-4">
          <EmptyState title="Sin rutinas todavía" description="Crea tus rutinas desde móvil y aquí tendrás una vista más amplia." />
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="text-base font-bold text-emerald-950">Rutinas ({routines.length})</h2>
            <div className="mt-3 space-y-2">
              {routines.map((routine) => (
                <article key={routine.id} className="rounded-2xl border border-emerald-100 bg-white p-3">
                  <p className="font-bold text-emerald-900">{routine.name}</p>
                  <p className="text-xs text-emerald-700">Días: {routine.days.join(', ')}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-teal-200 bg-teal-50 p-4">
            <h2 className="text-base font-bold text-teal-950">Ejercicios ({exercises.length})</h2>
            <div className="mt-3 space-y-2">
              {exercises.map((exercise) => (
                <article key={exercise.id} className="rounded-2xl border border-teal-100 bg-white p-3">
                  <p className="font-bold text-teal-900">{exercise.name}</p>
                  <p className="text-xs text-teal-700">
                    {exercise.sets} series • {exercise.reps} reps • {Math.round(exercise.duration_seconds / 60)} min
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
