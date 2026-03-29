import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { StudySession } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function StudyHistoryPage() {
  const { session } = useSession()
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setSessions([])
      setError(null)
      setLoading(false)
      return
    }

    let isActive = true

    async function loadSessions() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: historyError } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .returns<StudySession[]>()

        if (!isActive) {
          return
        }

        if (historyError) {
          setError(historyError.message)
        } else {
          setSessions(data ?? [])
        }
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error('Error inesperado cargando historial:', loadError)
        setError('No se pudo cargar el historial de estudio')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadSessions()

    return () => {
      isActive = false
    }
  }, [session?.user.id])

  const totalHours = useMemo(() => {
    const totalSeconds = sessions.reduce((sum, item) => sum + item.duration_seconds, 0)
    return (totalSeconds / 3600).toFixed(1)
  }, [sessions])

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Historial de estudio</h1>
      <p className="mt-1 text-sm text-purple-700">Total acumulado: {totalHours}h</p>

      {loading && <p className="mt-4 text-sm text-purple-700">Cargando sesiones...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="Aún no hay sesiones registradas"
            description="Cuando completes un bloque en el temporizador web, aparecerá aquí."
          />
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-3xl border border-purple-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100 text-left text-purple-800">
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Completado</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => (
                <tr key={item.id} className="border-b border-purple-50">
                  <td className="px-4 py-3 font-semibold text-purple-950">{item.subject}</td>
                  <td className="px-4 py-3 text-purple-900">{Math.round(item.duration_seconds / 60)} min</td>
                  <td className="px-4 py-3 text-purple-700">
                    {new Date(item.completed_at).toLocaleString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
