import { format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExamPrepSprint, ExamSprintMilestone } from '@/types/database'

interface SprintWithMilestones extends ExamPrepSprint {
  milestones: ExamSprintMilestone[]
}

interface SprintBoardProps {
  sprint: SprintWithMilestones
}

export function SprintBoard({ sprint }: SprintBoardProps) {
  const startDate = new Date(sprint.start_date)
  const endDate = new Date(sprint.end_date)

  // Generate all days in range
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const totalDays = days.length

  // Calculate progress
  const completedDays = 0 // Would be calculated from progress table
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Sprint header */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Sprint de {sprint.id}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(startDate, 'd MMMM', { locale: es })} →{' '}
              {format(endDate, 'd MMMM', { locale: es })}
            </p>
          </div>
          <Badge variant="outline" className="text-lg font-bold">
            {totalDays} días
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">Progreso</span>
            <span className="text-xs font-bold text-gray-800">
              {completedDays}/{totalDays} días
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Sprint info */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/30">
          <div>
            <p className="text-xs text-gray-600">Horas diarias</p>
            <p className="text-lg font-bold text-gray-800">{sprint.daily_target_hours}h</p>
          </div>
          {sprint.target_grade !== null && (
            <div>
              <p className="text-xs text-gray-600">Calificación objetivo</p>
              <p className="text-lg font-bold text-gray-800">{sprint.target_grade}/100</p>
            </div>
          )}
        </div>
      </Card>

      {/* Days columnar view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {days.map((day: Date) => {
          const isCompleted = false // Would check from progress table
          const isToday =
            format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')

          return (
            <Card
              key={format(day, 'yyyy-MM-dd')}
              className={`rounded-2xl border p-4 text-center transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  : isToday
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 ring-2 ring-yellow-300'
                    : 'bg-white/70 border-white/50 hover:border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Day circle */}
                <div className="relative w-8 h-8">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                {/* Day info */}
                <div className="text-xs">
                  <p className="font-bold text-gray-700">
                    {format(day, 'd', { locale: es })}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {format(day, 'EEE', { locale: es }).substring(0, 2)}
                  </p>
                </div>

                {/* Status badge */}
                {isCompleted && (
                  <Badge className="text-xs bg-green-500 text-white rounded-full">✓</Badge>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Milestones section */}
      {sprint.milestones && sprint.milestones.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Hitos principales</h4>
          <div className="space-y-2">
            {sprint.milestones.map((milestone) => (
              <Card
                key={milestone.id}
                className={`rounded-2xl border p-3 flex items-center gap-3 ${
                  milestone.is_completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white/70 border-white/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={milestone.is_completed}
                  disabled
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{milestone.description}</p>
                  <p className="text-xs text-gray-500">
                    Fecha: {format(new Date(milestone.target_date), 'd MMMM', { locale: es })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
