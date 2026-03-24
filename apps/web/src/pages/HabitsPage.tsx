import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { useHabits } from '@/hooks/useHabits'
import type { HabitLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'
import { Trash2 } from 'lucide-react'

export function HabitsPage() {
  const { session } = useSession()
  const { habits, loading, fetchHabits, createHabit, logHabit, deleteHabit } = useHabits(session?.user.id)
  const [newHabitName, setNewHabitName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  // Cargar logs del día actual
  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    const today = new Date().toISOString().slice(0, 10)

    async function loadTodaysLogs() {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .returns<HabitLog[]>()

      if (!error) {
        setLoggedToday(new Set(data?.map((log) => log.habit_id) ?? []))
      }
    }

    void loadTodaysLogs()
  }, [session?.user.id])

  const handleCreateHabit = async () => {
    if (!newHabitName.trim() || !session?.user.id) return
    setIsCreating(true)
    await createHabit(newHabitName)
    setNewHabitName('')
    setIsCreating(false)
  }

  const handleLogHabit = async (habitId: string) => {
    if (!session?.user.id) return

    const today = new Date().toISOString().slice(0, 10)
    const result = await logHabit(habitId, today)
    if (result) {
      setLoggedToday((prev) => new Set([...prev, habitId]))
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('¿Eliminar este hábito?')) {
      await deleteHabit(habitId)
    }
  }

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando hábitos...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Mis hábitos</h1>
          <p className="mt-1 text-sm text-purple-700">Completados hoy: {loggedToday.size} de {habits.length}</p>
        </div>
      </div>

      {/* Crear nuevo hábito */}
      <div className="mt-4 rounded-3xl border border-pink-200 bg-pink-50 p-4">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase text-pink-800">Nuevo hábito</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre del hábito (ej: Leer 30 min)"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && void handleCreateHabit()}
              className="flex-1 rounded-xl border border-pink-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void handleCreateHabit()}
              disabled={isCreating || !newHabitName.trim()}
              className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : '+ Crear'}
            </button>
          </div>
        </label>
      </div>

      {/* Lista de hábitos */}
      {habits.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Aún no tienes hábitos" description="Crea el primero para comenzar a rastrear tu progreso" />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {habits.map((habit) => {
            const completed = loggedToday.has(habit.id)

            return (
              <div key={habit.id} className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-green-950">{habit.name}</p>
                    <span
                      className={[
                        'mt-2 inline-flex rounded-full px-2 py-1 text-xs font-bold',
                        completed ? 'bg-emerald-200 text-emerald-900' : 'bg-yellow-100 text-yellow-800',
                      ].join(' ')}
                    >
                      {completed ? 'Completado hoy ✓' : 'Pendiente hoy'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!completed && (
                      <button
                        onClick={() => void handleLogHabit(habit.id)}
                        className="rounded-lg bg-green-500 px-3 py-1 text-sm font-semibold text-white hover:bg-green-600"
                      >
                        ✓ Marcar
                      </button>
                    )}
                    <button
                      onClick={() => void handleDeleteHabit(habit.id)}
                      className="rounded-lg bg-transparent p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
