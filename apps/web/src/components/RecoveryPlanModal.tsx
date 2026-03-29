import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useStreakRecovery } from '@/hooks/useStreakRecovery'
import { useSession } from '@/hooks/useSession'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RecoveryPlanModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecoveryPlanModal({ isOpen, onClose }: RecoveryPlanModalProps) {
  const recovery = useStreakRecovery()
  const activeRecoveryPlan = recovery.activeRecoveryPlan
  const { session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleStartRecovery = async () => {
    try {
      const userId = session?.user.id
      if (!userId) {
        toast.error('No pudimos identificar tu cuenta')
        return
      }

      setIsLoading(true)
      await recovery.createRecoveryPlan(userId)
      toast.success('Plan de recuperacion iniciado')
    } catch (err) {
      toast.error('No se pudo crear el plan')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteCurrentDay = async () => {
    try {
      if (!activeRecoveryPlan) return
      await recovery.completeRecoveryTask(activeRecoveryPlan.id)
      toast.success('Dia completado. Sigue asi')
    } catch (err) {
      toast.error('No se pudo completar la tarea')
      console.error(err)
    }
  }

  const handleDismiss = async () => {
    try {
      if (activeRecoveryPlan) {
        await recovery.dismissRecoveryPlan(activeRecoveryPlan.id)
      }
      onClose()
    } catch (err) {
      toast.error('No se pudo cerrar el plan')
      console.error(err)
    }
  }

  if (!activeRecoveryPlan && !isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Tu racha se rompio
          </DialogTitle>
          <DialogDescription>
            No te rindas. Aqui tienes un plan de recuperacion de 3 dias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {activeRecoveryPlan ? (
            <>
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Tu progreso</p>
                  <p className="text-2xl font-bold text-orange-500 mt-2">
                    {activeRecoveryPlan.completed_tasks}/{activeRecoveryPlan.recovery_tasks.length}
                  </p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                      style={{
                        width: `${(activeRecoveryPlan.completed_tasks / activeRecoveryPlan.recovery_tasks.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {activeRecoveryPlan.recovery_tasks.map((task, idx) => {
                  const isCompleted = idx < activeRecoveryPlan.completed_tasks

                  return (
                    <Card
                      key={idx}
                      className={`rounded-2xl border p-4 transition-all ${
                        isCompleted ? 'bg-green-50 border-green-200' : 'bg-white/70 border-white/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : idx === activeRecoveryPlan.completed_tasks ? (
                            <div className="w-5 h-5 rounded-full border-2 border-orange-400 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800">Dia {task.day}</p>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize bg-gray-50 text-gray-700 border-gray-200"
                            >
                              {task.difficulty === 'easy'
                                ? 'Facil'
                                : task.difficulty === 'medium'
                                  ? 'Media'
                                  : 'Dificil'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{task.description}</p>
                        </div>
                      </div>

                      {!isCompleted && idx === activeRecoveryPlan.completed_tasks && (
                        <Button
                          onClick={handleCompleteCurrentDay}
                          className="w-full mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
                          size="sm"
                        >
                          Completar este dia
                        </Button>
                      )}
                    </Card>
                  )
                })}
              </div>

              {activeRecoveryPlan.completed_tasks >= activeRecoveryPlan.recovery_tasks.length && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700">Plan completado</p>
                  <p className="text-sm text-green-600 mt-1">Tu racha esta en camino de recuperarse</p>
                </Card>
              )}

              <Button onClick={handleDismiss} variant="outline" className="w-full rounded-xl border-gray-200">
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Card className="bg-white/70 rounded-2xl border border-white/50 p-4">
                <p className="text-sm text-gray-700 text-center">
                  Quieres crear un plan de recuperacion personalizado?
                </p>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200"
                >
                  Ahora no
                </Button>
                <Button
                  onClick={handleStartRecovery}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
                >
                  {isLoading ? 'Creando...' : 'Empezar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
