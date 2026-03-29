import { useState } from 'react'
import { ArrowRight, BookOpen, Plus } from 'lucide-react'
import { useExamSprints } from '@/hooks/useExamSprints'
import { SprintCreator } from '@/components/SprintCreator'
import { SprintBoard } from '@/components/SprintBoard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ExamCenter() {
  const { sprints, isLoading, error } = useExamSprints()
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)


  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)
  const activeSprints = sprints.filter((s) => new Date(s.end_date) >= new Date())
  const pastSprints = sprints.filter((s) => new Date(s.end_date) < new Date())

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-purple-900 flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            Centro de Exámenes
          </h1>
          <p className="text-gray-600">
            Planifica tus preparaciones con sprints estratégicos y hitos alcanzables
          </p>
        </div>

        {/* Create button */}
        <Button
          onClick={() => setIsCreatorOpen(true)}
          className="mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear nuevo sprint
        </Button>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-3xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200 rounded-3xl p-6">
            <p className="text-red-700 font-medium">
              No se pudo cargar los sprints: {error.message}
            </p>
          </Card>
        ) : sprints.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Sin sprints de examen aún
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer sprint para empezar a prepararte estratégicamente
            </p>
            <Button
              onClick={() => setIsCreatorOpen(true)}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            >
              Crear sprint
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSprint ? (
                <>
                  <Button
                    onClick={() => setSelectedSprintId(null)}
                    variant="outline"
                    className="rounded-xl border-gray-200"
                  >
                    ← Volver a lista
                  </Button>
                  <SprintBoard sprint={selectedSprint} />
                </>
              ) : (
                <>
                  {/* Active sprints */}
                  {activeSprints.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Sprints Activos
                      </h2>
                      <div className="space-y-3">
                        {activeSprints.map((sprint) => (
                          <Card
                            key={sprint.id}
                            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedSprintId(sprint.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-800">
                                  Sprint: {sprint.id}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {sprint.daily_target_hours}h/día
                                  {sprint.target_grade && ` • Meta: ${sprint.target_grade}/100`}
                                </p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past sprints */}
                  {pastSprints.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Sprints Anteriores
                      </h2>
                      <div className="space-y-3">
                        {pastSprints.map((sprint) => (
                          <Card
                            key={sprint.id}
                            className="bg-gray-50/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer opacity-75"
                            onClick={() => setSelectedSprintId(sprint.id)}
                          >
                            <h3 className="font-bold text-gray-700">{sprint.id}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Completado • {sprint.daily_target_hours}h/día
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border border-white/50 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Estadísticas</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">
                      Sprints activos
                    </p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {activeSprints.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">
                      Total completados
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {pastSprints.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-3">Consejos</h3>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>Establece horas realistas diarias</li>
                  <li>Crea hitos cada 3-4 días</li>
                  <li>Registra tu progreso diariamente</li>
                  <li>Sé flexible si necesitas ajustar</li>
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>

      <SprintCreator isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} />
    </div>
  )
}
