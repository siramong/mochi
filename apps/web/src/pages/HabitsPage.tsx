import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { useHabits, type HabitColor, type HabitIcon } from '@/hooks/useHabits'
import { useCyclePhase } from '@/hooks/useCyclePhase'
import { useSession } from '@/hooks/useSession'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const colorOptions: Array<{ key: HabitColor; circleClass: string }> = [
  { key: 'pink', circleClass: 'bg-pink-400' },
  { key: 'yellow', circleClass: 'bg-yellow-400' },
  { key: 'blue', circleClass: 'bg-blue-400' },
  { key: 'teal', circleClass: 'bg-teal-400' },
  { key: 'purple', circleClass: 'bg-purple-400' },
]

const iconOptions: Array<{ key: HabitIcon; label: string }> = [
  { key: 'leaf', label: 'Hoja' },
  { key: 'water', label: 'Agua' },
  { key: 'book', label: 'Libro' },
  { key: 'heart', label: 'Corazón' },
  { key: 'fitness', label: 'Fitness' },
]

const cardColorClasses: Record<HabitColor, string> = {
  pink: 'border-pink-200 bg-pink-50',
  yellow: 'border-yellow-200 bg-yellow-50',
  blue: 'border-blue-200 bg-blue-50',
  teal: 'border-teal-200 bg-teal-50',
  purple: 'border-purple-200 bg-purple-50',
}

export function HabitsPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const { habits, loading, fetchHabits, fetchWeeklyLogs, createHabit, logHabit, deleteHabitLog, deleteHabit } =
    useHabits(userId)
  const { phase, personality } = useCyclePhase()

  const [newHabitName, setNewHabitName] = useState('')
  const [selectedColor, setSelectedColor] = useState<HabitColor>('pink')
  const [selectedIcon, setSelectedIcon] = useState<HabitIcon>('leaf')
  const [isCreating, setIsCreating] = useState(false)
  const [weeklyLogs, setWeeklyLogs] = useState<Map<string, Set<string>>>(new Map())
  const [actionError, setActionError] = useState<string | null>(null)

  const last7Days = useMemo(() => getLast7Days(), [])
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const refreshAll = useCallback(async () => {
    if (!userId) return

    await fetchHabits()
    const weekMap = await fetchWeeklyLogs(userId)
    setWeeklyLogs(weekMap)
  }, [fetchHabits, fetchWeeklyLogs, userId])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  const handleCreateHabit = async () => {
    if (!newHabitName.trim() || !userId) return

    setIsCreating(true)
    setActionError(null)

    const created = await createHabit(newHabitName.trim(), selectedIcon, selectedColor)
    if (!created) {
      setActionError('No se pudo crear el hábito')
      setIsCreating(false)
      return
    }

    setNewHabitName('')
    setSelectedColor('pink')
    setSelectedIcon('leaf')
    await refreshAll()
    setIsCreating(false)
  }

  const handleToggleToday = async (habitId: string) => {
    if (!userId) return

    setActionError(null)
    const isCompleted = weeklyLogs.get(habitId)?.has(today) ?? false

    if (isCompleted) {
      const removed = await deleteHabitLog(userId, habitId, today)
      if (!removed) {
        setActionError('No se pudo desmarcar el hábito')
        return
      }
    } else {
      const logged = await logHabit(habitId, today)
      if (!logged) {
        setActionError('No se pudo marcar el hábito')
        return
      }
    }

    const weekMap = await fetchWeeklyLogs(userId)
    setWeeklyLogs(weekMap)
  }

  const handleDeleteHabit = async (habitId: string) => {
    const confirmed = window.confirm('¿Eliminar este hábito?')
    if (!confirmed) return

    const deleted = await deleteHabit(habitId)
    if (!deleted) {
      setActionError('No se pudo eliminar el hábito')
      return
    }

    if (userId) {
      const weekMap = await fetchWeeklyLogs(userId)
      setWeeklyLogs(weekMap)
    }
  }

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando hábitos...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Mis hábitos</h1>
      <p className="mt-1 text-sm text-purple-700">Construye consistencia con pasos pequeños todos los días</p>

      {personality ? (
        <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50 p-3">
          <p className="text-xs font-bold uppercase text-purple-700">Tip de fase: {phase}</p>
          <p className="text-sm font-semibold text-purple-900">{personality.recommendation}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-3xl border border-green-200 bg-green-50 p-4">
        <p className="text-xs font-bold uppercase text-green-800">Nuevo hábito</p>

        <label className="mt-3 block">
          <span className="text-sm font-semibold text-green-900">Nombre</span>
          <input
            type="text"
            value={newHabitName}
            onChange={(event) => setNewHabitName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm"
            placeholder="Ej: Leer 30 minutos"
          />
        </label>

        <div className="mt-4">
          <p className="text-sm font-semibold text-green-900">Color</p>
          <div className="mt-2 flex items-center gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={[
                  'h-8 w-8 rounded-full border-2',
                  option.circleClass,
                  selectedColor === option.key ? 'border-slate-800' : 'border-transparent',
                ].join(' ')}
                onClick={() => setSelectedColor(option.key)}
                aria-label={`Color ${option.key}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-green-900">Ícono</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {iconOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={[
                  'rounded-full border px-3 py-1 text-xs font-bold',
                  selectedIcon === option.key
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-green-200 bg-white text-green-800',
                ].join(' ')}
                onClick={() => setSelectedIcon(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={isCreating || !newHabitName.trim()}
          onClick={() => {
            void handleCreateHabit()
          }}
          className="mt-5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isCreating ? 'Creando...' : 'Crear'}
        </button>
      </div>

      {actionError ? <p className="mt-3 text-sm font-semibold text-red-600">{actionError}</p> : null}

      {habits.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Aún no tienes hábitos" description="Crea el primero para comenzar a rastrear tu semana." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {habits.map((habit) => {
            const logs = weeklyLogs.get(habit.id) ?? new Set<string>()
            const completedThisWeek = last7Days.filter((day) => logs.has(day)).length
            const completedToday = logs.has(today)
            const safeColor = (habit.color as HabitColor) || 'pink'

            return (
              <article key={habit.id} className={[
                'rounded-2xl border p-4',
                cardColorClasses[safeColor] || cardColorClasses.pink,
              ].join(' ')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-900">{habit.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteHabit(habit.id)
                    }}
                    className="rounded-lg p-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    {last7Days.map((day) => (
                      <span
                        key={day}
                        className={[
                          'h-3.5 w-3.5 rounded-full border',
                          logs.has(day) ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white',
                        ].join(' ')}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between px-0.5 text-xs font-semibold text-slate-600">
                    {dayLabels.map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700">
                    {completedThisWeek}/7 días esta semana
                  </span>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    disabled={completedToday}
                    onClick={() => {
                      void handleToggleToday(habit.id)
                    }}
                    className={[
                      'rounded-xl px-3 py-2 text-sm font-semibold',
                      completedToday
                        ? 'cursor-not-allowed bg-green-200 text-green-800'
                        : 'bg-green-500 text-white hover:bg-green-600',
                    ].join(' ')}
                  >
                    {completedToday ? '✓ Marcado' : '✓ Marcar hoy'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
