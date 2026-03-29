import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Goal } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function GoalsPage() {
  const { session } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setGoals([])
      setError(null)
      setLoading(false)
      return
    }

    let isActive = true

    async function loadGoals() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .returns<Goal[]>()

        if (!isActive) {
          return
        }

        if (goalsError) {
          setError(goalsError.message)
          setGoals([])
          return
        }

        setGoals(data ?? [])
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error('Error inesperado cargando metas:', loadError)
        setError('No se pudieron cargar las metas')
        setGoals([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadGoals()

    return () => {
      isActive = false
    }
  }, [session?.user.id])

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando metas...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (goals.length === 0) {
    return <EmptyState title="Sin metas aún" description="Define tus metas en móvil y monitorea aquí su avance." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Metas</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => (
          <article key={goal.id} className="rounded-2xl border border-pink-200 bg-pink-50 p-4">
            <p className="font-bold text-pink-950">{goal.title}</p>
            {goal.description ? <p className="mt-1 text-sm text-pink-800">{goal.description}</p> : null}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-pink-500" style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-pink-700">Progreso: {goal.progress}%</p>
          </article>
        ))}
      </div>
    </div>
  )
}
