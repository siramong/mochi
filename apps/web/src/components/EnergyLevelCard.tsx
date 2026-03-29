import { TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { useEnergyDaily } from '@/hooks/useEnergyDaily'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EnergyLevelCardProps {
  onLogEnergy?: () => void
}

export function EnergyLevelCard({ onLogEnergy }: EnergyLevelCardProps) {
  const { todayEnergy, trend, isLoading, error } = useEnergyDaily()

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
        <p className="text-sm text-gray-500">Error al cargar tu energía</p>
      </Card>
    )
  }

  const percentage = todayEnergy ? (todayEnergy / 5) * 100 : 0
  const trendIcon = trend === 'up' ? <TrendingUp /> : trend === 'down' ? <TrendingDown /> : null

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <p className="text-sm font-semibold text-gray-700">Tu Energía Hoy</p>
          </div>

          {todayEnergy !== null ? (
            <>
              <div className="mb-4">
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                  {todayEnergy}/5
                </p>
              </div>

              {/* Energy bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Trend indicator */}
              {trendIcon && (
                <div className="flex items-center gap-1 text-xs font-medium">
                  {trendIcon}
                  <span className="text-gray-600">
                    {trend === 'up'
                      ? 'En aumento'
                      : trend === 'down'
                        ? 'En descenso'
                        : 'Estable'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">Aún no registras tu energía hoy</p>
          )}
        </div>
      </div>

      {onLogEnergy && (
        <Button
          onClick={onLogEnergy}
          variant="outline"
          className="w-full mt-4 rounded-xl border-gray-200 hover:bg-white/50"
        >
          Registrar energía
        </Button>
      )}
    </Card>
  )
}
