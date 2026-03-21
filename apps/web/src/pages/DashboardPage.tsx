import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, BookOpen, Dumbbell, Heart, Star } from 'lucide-react'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

type DashboardStats = {
  todayBlocks: number
  routines: number
  habitsToday: number
  moodThisWeek: number
}

export function DashboardPage() {
  const { session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    todayBlocks: 0,
    routines: 0,
    habitsToday: 0,
    moodThisWeek: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      setError(null)

      const today = new Date()
      const dayOfWeek = today.getDay()
      const todayISO = today.toISOString().slice(0, 10)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 6)

      const [blocksRes, routinesRes, habitsRes, moodRes] = await Promise.all([
        supabase.from('study_blocks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('day_of_week', dayOfWeek),
        supabase.from('routines').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('log_date', todayISO),
        supabase
          .from('mood_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('logged_date', weekAgo.toISOString().slice(0, 10)),
      ])

      if (blocksRes.error || routinesRes.error || habitsRes.error || moodRes.error) {
        setError('No se pudo cargar el resumen de hoy')
      } else {
        setStats({
          todayBlocks: blocksRes.count ?? 0,
          routines: routinesRes.count ?? 0,
          habitsToday: habitsRes.count ?? 0,
          moodThisWeek: moodRes.count ?? 0,
        })
      }

      setLoading(false)
    }

    void loadData()
  }, [session?.user.id])

  if (loading) {
    return <p className="text-sm font-semibold text-purple-700">Cargando dashboard...</p>
  }

  if (error) {
    return <p className="text-sm font-semibold text-red-600">{error}</p>
  }

  return (
    <div>
      <MochiCompanion
        mood="happy"
        title="Hola, soy Mochi"
        message="Hoy vamos por enfoque suave: pasos pequeños, progreso real."
        className="mb-4"
      />
      <h1 className="text-2xl font-black text-purple-950">Resumen de hoy</h1>
      <p className="mt-1 text-sm text-purple-700">Tu progreso diario en estudio, bienestar y hábitos</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-900">
            <BookOpen className="h-4 w-4" />
            <p className="text-sm font-bold">Bloques hoy</p>
          </div>
          <p className="mt-2 text-3xl font-black text-blue-950">{stats.todayBlocks}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-900">
            <Dumbbell className="h-4 w-4" />
            <p className="text-sm font-bold">Rutinas</p>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-950">{stats.routines}</p>
        </div>
        <div className="rounded-3xl border border-pink-200 bg-pink-50 p-4">
          <div className="flex items-center gap-2 text-pink-900">
            <Star className="h-4 w-4" />
            <p className="text-sm font-bold">Hábitos completados</p>
          </div>
          <p className="mt-2 text-3xl font-black text-pink-950">{stats.habitsToday}</p>
        </div>
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 text-yellow-900">
            <Heart className="h-4 w-4" />
            <p className="text-sm font-bold">Registros de ánimo (7d)</p>
          </div>
          <p className="mt-2 text-3xl font-black text-yellow-950">{stats.moodThisWeek}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/study" className="rounded-3xl border border-purple-200 bg-white p-4 transition-colors hover:bg-purple-50">
          <div className="flex items-center gap-2 text-purple-900">
            <AlarmClock className="h-4 w-4" />
            <p className="font-bold">Planificar estudio</p>
          </div>
          <p className="mt-1 text-sm text-purple-700">Organiza tus bloques semanales y mantén el ritmo.</p>
        </Link>
        <Link to="/study/history" className="rounded-3xl border border-blue-200 bg-white p-4 transition-colors hover:bg-blue-50">
          <div className="flex items-center gap-2 text-blue-900">
            <BookOpen className="h-4 w-4" />
            <p className="font-bold">Ver historial</p>
          </div>
          <p className="mt-1 text-sm text-blue-700">Revisa tus sesiones completadas y el tiempo total.</p>
        </Link>
      </div>
    </div>
  )
}
