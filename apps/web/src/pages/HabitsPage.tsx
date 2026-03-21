import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Habit, HabitLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function HabitsPage() {
  const { session } = useSession()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadHabits() {
      const today = new Date().toISOString().slice(0, 10)
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Habit[]>(),
        supabase.from('habit_logs').select('*').eq('user_id', userId).eq('log_date', today).returns<HabitLog[]>(),
      ])

      if (!habitsRes.error) setHabits(habitsRes.data ?? [])
      if (!logsRes.error) setLogs(logsRes.data ?? [])
      setLoading(false)
    }

    void loadHabits()
  }, [session?.user.id])

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando hábitos...</p>
  }

  if (habits.length === 0) {
    return <EmptyState title="Aún no tienes hábitos" description="Agrégalos desde móvil y revisa aquí tu avance diario." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Hábitos</h1>
      <p className="mt-1 text-sm text-purple-700">Hoy completaste {logs.length} de {habits.length}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {habits.map((habit) => {
          const completed = logs.some((log) => log.habit_id === habit.id)

          return (
            <article key={habit.id} className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="font-bold text-green-950">{habit.name}</p>
              <p className="mt-1 text-xs font-semibold text-green-700">Color: {habit.color}</p>
              <span
                className={[
                  'mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold',
                  completed
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-yellow-100 text-yellow-800',
                ].join(' ')}
              >
                {completed ? 'Completado hoy' : 'Pendiente hoy'}
              </span>
            </article>
          )
        })}
      </div>
    </div>
  )
}
