import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, BookOpen, Dumbbell, Flame, Heart, Sparkles, Star } from 'lucide-react'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { useCyclePhase } from '@/hooks/useCyclePhase'

type DashboardStats = {
  todayBlocks: number
  routines: number
  habitsToday: number
  moodThisWeek: number
}

type ProgressData = {
  totalPoints: number
  currentStreak: number
  lastAchievementTitle: string | null
}

export function DashboardPage() {
  const { session } = useSession()
  const { phase, dayOfCycle, daysUntilNextPeriod } = useCyclePhase()
  const DASHBOARD_TIMEOUT_MS = 12000
  const isCycleInfoUnavailable = phase === 'unknown' || dayOfCycle <= 0
  const phaseLabel = phase === 'unknown' ? 'Desconocido' : phase

  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(errorMessage))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }

  const [stats, setStats] = useState<DashboardStats>({
    todayBlocks: 0,
    routines: 0,
    habitsToday: 0,
    moodThisWeek: 0,
  })
  const [progress, setProgress] = useState<ProgressData>({
    totalPoints: 0,
    currentStreak: 0,
    lastAchievementTitle: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekly, setWeekly] = useState({
    studyHours: 0,
    sessions: 0,
    routines: 0,
    habitsCompleted: 0,
    habitsTotal: 0,
    points: 0,
  })

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    let isActive = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const today = new Date()
        const dayOfWeek = today.getDay()
        const todayISO = today.toISOString().slice(0, 10)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 6)

        const [blocksRes, routinesRes, habitsRes, moodRes, profileRes, streakRes, lastAchievementRes] =
          await withTimeout(Promise.allSettled([
            supabase
              .from('study_blocks')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('day_of_week', dayOfWeek),
            supabase.from('routines').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase
              .from('habit_logs')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('log_date', todayISO),
            supabase
              .from('mood_logs')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .gte('logged_date', weekAgo.toISOString().slice(0, 10)),
            supabase.from('profiles').select('total_points').eq('id', userId).maybeSingle<{ total_points: number }>(),
            supabase.from('streaks').select('current_streak').eq('user_id', userId).maybeSingle<{ current_streak: number }>(),
            supabase
              .from('user_achievements')
              .select('unlocked_at, achievement:achievements(title)')
              .eq('user_id', userId)
              .order('unlocked_at', { ascending: false })
              .limit(1)
              .maybeSingle<{ unlocked_at: string; achievement: { title: string } }>(),
              ]), DASHBOARD_TIMEOUT_MS, 'Tiempo de espera agotado al cargar el dashboard')

        const now = new Date()
        const isMonday = now.getDay() === 1
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay() + 1 - (isMonday ? 7 : 0))
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)

        const [weeklyStudyRes, weeklySessionsRes, weeklyRoutinesRes, weeklyHabitsRes, habitsCountRes, weeklyGratitudeRes] = await withTimeout(Promise.allSettled([
          supabase
            .from('study_sessions')
            .select('duration_seconds, completed_at')
            .eq('user_id', userId)
            .gte('completed_at', weekStart.toISOString())
            .lt('completed_at', weekEnd.toISOString()),
          supabase
            .from('study_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('completed_at', weekStart.toISOString())
            .lt('completed_at', weekEnd.toISOString()),
          supabase
            .from('routine_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('completed_at', weekStart.toISOString())
            .lt('completed_at', weekEnd.toISOString()),
          supabase
            .from('habit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('log_date', weekStart.toISOString().slice(0, 10))
            .lt('log_date', weekEnd.toISOString().slice(0, 10)),
          supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase
            .from('gratitude_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('logged_date', weekStart.toISOString().slice(0, 10))
            .lt('logged_date', weekEnd.toISOString().slice(0, 10)),
          ]), DASHBOARD_TIMEOUT_MS, 'Tiempo de espera agotado al cargar el dashboard')

        if (!isActive) return

        const primaryHasError =
          blocksRes.status === 'rejected'
          || routinesRes.status === 'rejected'
          || habitsRes.status === 'rejected'
          || moodRes.status === 'rejected'
          || (blocksRes.status === 'fulfilled' && !!blocksRes.value.error)
          || (routinesRes.status === 'fulfilled' && !!routinesRes.value.error)
          || (habitsRes.status === 'fulfilled' && !!habitsRes.value.error)
          || (moodRes.status === 'fulfilled' && !!moodRes.value.error)

        if (primaryHasError) {
          setError('No se pudo cargar el resumen de hoy')
        }

        setStats({
          todayBlocks: blocksRes.status === 'fulfilled' ? (blocksRes.value.count ?? 0) : 0,
          routines: routinesRes.status === 'fulfilled' ? (routinesRes.value.count ?? 0) : 0,
          habitsToday: habitsRes.status === 'fulfilled' ? (habitsRes.value.count ?? 0) : 0,
          moodThisWeek: moodRes.status === 'fulfilled' ? (moodRes.value.count ?? 0) : 0,
        })

        setProgress({
          totalPoints:
            profileRes.status === 'fulfilled' && !profileRes.value.error
              ? (profileRes.value.data?.total_points ?? 0)
              : 0,
          currentStreak:
            streakRes.status === 'fulfilled' && !streakRes.value.error
              ? (streakRes.value.data?.current_streak ?? 0)
              : 0,
          lastAchievementTitle:
            lastAchievementRes.status === 'fulfilled' && !lastAchievementRes.value.error
              ? (lastAchievementRes.value.data?.achievement?.title ?? null)
              : null,
        })

        const studyHours = (
          ((weeklyStudyRes.status === 'fulfilled'
            ? (weeklyStudyRes.value.data as Array<{ duration_seconds: number }> | null)
            : null) ?? [])
            .reduce((sum, row) => sum + row.duration_seconds, 0) / 3600
        )

        const sessionsCount = weeklySessionsRes.status === 'fulfilled' ? (weeklySessionsRes.value.count ?? 0) : 0
        const routinesCount = weeklyRoutinesRes.status === 'fulfilled' ? (weeklyRoutinesRes.value.count ?? 0) : 0
        const habitsCompleted = weeklyHabitsRes.status === 'fulfilled' ? (weeklyHabitsRes.value.count ?? 0) : 0
        const habitsCatalogCount = habitsCountRes.status === 'fulfilled' ? (habitsCountRes.value.count ?? 0) : 0
        const gratitudeCount = weeklyGratitudeRes.status === 'fulfilled' ? (weeklyGratitudeRes.value.count ?? 0) : 0
        const points = sessionsCount * 5 + routinesCount * 10 + gratitudeCount * 3

        setWeekly({
          studyHours: Number(studyHours.toFixed(1)),
          sessions: sessionsCount,
          routines: routinesCount,
          habitsCompleted,
          habitsTotal: habitsCatalogCount * 7,
          points,
        })
      } catch (loadError) {
        if (!isActive) return
        console.error('Error cargando dashboard:', loadError)
        setError('No se pudo cargar el dashboard')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
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

      <div className="mt-6 rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-purple-50 p-5">
        <h2 className="text-lg font-black text-purple-950">Tu progreso</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <p className="inline-flex items-center text-xs font-bold uppercase text-yellow-700">
              <Star className="mr-1 h-4 w-4" /> Puntos totales
            </p>
            <p className="mt-2 text-3xl font-black text-yellow-900">{progress.totalPoints}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="inline-flex items-center text-xs font-bold uppercase text-orange-700">
              <Flame className="mr-1 h-4 w-4" /> Racha actual
            </p>
            <p className="mt-2 text-3xl font-black text-orange-900">{progress.currentStreak}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-purple-700">Último logro desbloqueado</p>
                <p className="mt-1 text-sm font-semibold text-purple-900">
                  {progress.lastAchievementTitle ?? 'Aún no hay logros desbloqueados'}
                </p>
                <p className="mt-1 text-xs text-purple-600">Sigue constante y pronto desbloquearás el siguiente.</p>
              </div>
            </div>
          </div>
        </div>
        <Link to="/profile" className="mt-4 inline-flex text-sm font-semibold text-purple-700 hover:text-purple-900">
          Ver todos los logros
        </Link>
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

      <div className="mt-6 rounded-3xl border border-rose-200 bg-white p-4">
        <p className="text-xs font-bold uppercase text-rose-700">Tu fase actual</p>
        <p className="mt-1 text-lg font-black text-rose-950">{phaseLabel}</p>
        <p className="text-sm font-semibold text-rose-700">
          {isCycleInfoUnavailable
            ? 'Registra tu periodo para ver esta información'
            : `Día ${dayOfCycle} del ciclo · Próximo período en ${daysUntilNextPeriod} días`}
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-indigo-200 bg-white p-5">
        <h2 className="text-lg font-black text-indigo-950">Tu semana</h2>
        <p className="text-sm text-indigo-700">Resumen de estudio, hábitos y constancia.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-indigo-50 p-3"><p className="text-xs font-bold text-indigo-700">Horas de estudio</p><p className="text-2xl font-black text-indigo-950">{weekly.studyHours}</p></div>
          <div className="rounded-2xl bg-blue-50 p-3"><p className="text-xs font-bold text-blue-700">Sesiones completadas</p><p className="text-2xl font-black text-blue-950">{weekly.sessions}</p></div>
          <div className="rounded-2xl bg-teal-50 p-3"><p className="text-xs font-bold text-teal-700">Rutinas</p><p className="text-2xl font-black text-teal-950">{weekly.routines}</p></div>
          <div className="rounded-2xl bg-green-50 p-3"><p className="text-xs font-bold text-green-700">Hábitos</p><p className="text-2xl font-black text-green-950">{weekly.habitsCompleted}/{weekly.habitsTotal}</p></div>
          <div className="rounded-2xl bg-yellow-50 p-3"><p className="text-xs font-bold text-yellow-700">Puntos ganados</p><p className="text-2xl font-black text-yellow-950">{weekly.points}</p></div>
          <div className="rounded-2xl bg-orange-50 p-3"><p className="text-xs font-bold text-orange-700">Racha más larga</p><p className="text-2xl font-black text-orange-950">{progress.currentStreak}</p></div>
        </div>
      </div>
    </div>
  )
}
