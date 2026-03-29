import { AlertCircle, Zap } from 'lucide-react'
import { useCyclePhase } from '@/hooks/useCyclePhase'
import { useEnergyDaily } from '@/hooks/useEnergyDaily'
import { useTodaysPlannedTasks } from '@/hooks/useTodaysPlannedTasks'
import { useProfile } from '@/hooks/useProfile'
import { scoreTodaysTasks } from '@/lib/plannerLogic'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TaskScore } from '@/types/database'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Streak } from '@/types/database'

function toPlannerPhase(phase: ReturnType<typeof useCyclePhase>['phase']) {
  switch (phase) {
    case 'menstrual':
      return 'menstruation' as const
    case 'folicular':
      return 'follicular' as const
    case 'ovulatoria':
      return 'ovulation' as const
    case 'lutea':
      return 'luteal' as const
    default:
      return null
  }
}

interface DailyPlannerDashboardProps {
  onTaskClick?: (taskId: string, type: string) => void
}

export function DailyPlannerDashboard({ onTaskClick }: DailyPlannerDashboardProps) {
  const cycle = useCyclePhase()
  const phase = toPlannerPhase(cycle.phase)
  const { todayEnergy } = useEnergyDaily()
  const { tasks, isLoading: tasksLoading } = useTodaysPlannedTasks()
  const { profile } = useProfile()
  const { data: streak } = useQuery({
    queryKey: ['streak', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle<Streak>()
      if (error) throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const isLoading = tasksLoading
  const currentStreak = streak?.current_streak ?? 0
  const scoredTasks: TaskScore[] = scoreTodaysTasks(
    todayEnergy,
    phase ?? null,
    currentStreak,
    tasks
  )

  const getRecommendLevelColor = (level: string) => {
    switch (level) {
      case 'light':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'intense':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study':
        return 'Estudio'
      case 'routine':
        return 'Rutina'
      case 'goal':
        return 'Meta'
      case 'habit':
        return 'Hábito'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </Card>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Zap className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">Aún no tienes tareas planeadas para hoy</p>
          <p className="text-xs text-gray-500 mt-1">Crea un bloque de estudio, rutina o meta</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Tareas Sugeridas para Hoy</h2>
        <p className="text-xs text-gray-600">Basadas en tu energía, ciclo y racha</p>
      </div>

      {scoredTasks.length === 0 ? (
        <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">No hay tareas para priorizar</p>
              <p className="text-xs text-gray-500 mt-1">
                Pero tienes {tasks.length} tareas disponibles
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {scoredTasks.map((task, idx) => (
            <Card
              key={task.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTaskClick?.(task.id, task.type)}
            >
              <div className="flex items-start gap-4">
                {/* Rank number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(task.type)}
                    </Badge>
                    <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      {task.score.toFixed(0)}pt
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{task.reason}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRecommendLevelColor(task.recommendedLevel)}`}
                    >
                      {task.recommendedLevel === 'light'
                        ? 'Ligero'
                        : task.recommendedLevel === 'medium'
                          ? 'Moderado'
                          : 'Intenso'}
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-gray-300 text-lg flex-shrink-0">→</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
