import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarClock, Clock3, Flame, GraduationCap, HeartPulse, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { EngagementEvent, ExamLog, Habit, HabitLog, StudySession } from '@/types/database'

type ActivitySummary = {
  activeDays7: number
  activeDays30: number
  activeDays90: number
  previous30ActiveDays: number
  weeklyActiveCount12: number
}

type StudySummary = {
  sessions30: number
  totalMinutes30: number
  averageMinutes30: number
}

type StudyDailyPoint = {
  day: string
  minutos: number
}

type HabitFrequencyItem = {
  id: string
  name: string
  color: string
  completions30: number
  weeklyAverage: number
  completionRate: number
}

type HeatmapCell = {
  day: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

const HEAT_LEVEL_COLORS: Record<HeatmapCell['level'], string> = {
  0: '#F1F5F9',
  1: '#D1FAE5',
  2: '#86EFAC',
  3: '#34D399',
  4: '#059669',
}

const HABIT_BAR_COLORS: Record<string, string> = {
  pink: '#F9A8D4',
  yellow: '#FDE68A',
  blue: '#93C5FD',
  teal: '#99F6E4',
  purple: '#C4B5FD',
}

const HABIT_BAR_FALLBACK_COLOR = HABIT_BAR_COLORS.teal

function resolveHabitBarColor(colorToken?: string): string {
  if (!colorToken) return HABIT_BAR_FALLBACK_COLOR
  return HABIT_BAR_COLORS[colorToken.toLowerCase()] ?? HABIT_BAR_FALLBACK_COLOR
}

function startOfDay(date: Date): Date {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getLastDays(days: number, base = new Date()): string[] {
  const anchor = startOfDay(base)
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(anchor)
    day.setDate(anchor.getDate() - (days - 1 - index))
    return toISODate(day)
  })
}

function shortDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  const day = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date)
  const dayNumber = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(date)
  return `${day.slice(0, 2)} ${dayNumber}`
}

function groupByWeeks(days: string[]): string[][] {
  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }
  return weeks
}

function getPostgresErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : null
  }
  return null
}

function uniqueDateSetFromActivity(
  engagementRows: Pick<EngagementEvent, 'occurred_at'>[],
  studyRows: Pick<StudySession, 'completed_at'>[],
  habitLogRows: Pick<HabitLog, 'log_date'>[],
  examRows: Array<Pick<ExamLog, 'created_at' | 'exam_date' | 'is_upcoming'>>
): Set<string> {
  const set = new Set<string>()

  engagementRows.forEach((row) => {
    set.add(row.occurred_at.slice(0, 10))
  })

  studyRows.forEach((row) => {
    set.add(row.completed_at.slice(0, 10))
  })

  habitLogRows.forEach((row) => {
    set.add(row.log_date)
  })

  examRows.forEach((row) => {
    if (row.is_upcoming === true) return

    const activityDay = row.exam_date.slice(0, 10) || row.created_at.slice(0, 10)
    set.add(activityDay)
  })

  return set
}

function computeActiveDaysInRange(dates: Set<string>, startDateISO: string, endDateISO: string): number {
  let count = 0
  dates.forEach((date) => {
    if (date >= startDateISO && date <= endDateISO) count += 1
  })
  return count
}

function formatDateLong(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function AnalyticsPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadSeed, setReloadSeed] = useState(0)

  const [studyRows90, setStudyRows90] = useState<StudySession[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitLogs90, setHabitLogs90] = useState<HabitLog[]>([])
  const [upcomingExams, setUpcomingExams] = useState<ExamLog[]>([])
  const [examActivityRows90, setExamActivityRows90] = useState<Array<Pick<ExamLog, 'created_at' | 'exam_date' | 'is_upcoming'>>>([])
  const [engagementRows90, setEngagementRows90] = useState<Array<Pick<EngagementEvent, 'occurred_at'>>>([])
  const [engagementAvailable, setEngagementAvailable] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setError(null)
      setStudyRows90([])
      setHabits([])
      setHabitLogs90([])
      setUpcomingExams([])
      setExamActivityRows90([])
      setEngagementRows90([])
      setEngagementAvailable(false)
      return
    }

    let isActive = true

    async function loadAnalytics() {
      setLoading(true)
      setError(null)
      try {
        const now = new Date()
        const todayISO = toISODate(startOfDay(now))
        const since90 = new Date(now)
        since90.setDate(since90.getDate() - 89)
        const since90ISODate = toISODate(startOfDay(since90))
        const since90ISODateTime = `${since90ISODate}T00:00:00`

        const [studyRes, habitsRes, habitLogsRes, examsRes, examActivityRes, engagementRes] = await Promise.allSettled([
          supabase
            .from('study_sessions')
            .select('id, user_id, study_block_id, subject, duration_seconds, completed_at')
            .eq('user_id', userId)
            .gte('completed_at', since90ISODateTime)
            .order('completed_at', { ascending: true })
            .returns<StudySession[]>(),
          supabase
            .from('habits')
            .select('id, user_id, name, icon, color, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .returns<Habit[]>(),
          supabase
            .from('habit_logs')
            .select('id, user_id, habit_id, log_date')
            .eq('user_id', userId)
            .gte('log_date', since90ISODate)
            .lte('log_date', todayISO)
            .returns<HabitLog[]>(),
          supabase
            .from('exam_logs')
            .select('id, user_id, subject, grade, max_grade, notes, preparation_notes, exam_date, is_upcoming, created_at')
            .eq('user_id', userId)
            .eq('is_upcoming', true)
            .gte('exam_date', todayISO)
            .order('exam_date', { ascending: true })
            .limit(6)
            .returns<ExamLog[]>(),
          supabase
            .from('exam_logs')
            .select('created_at, exam_date, is_upcoming')
            .eq('user_id', userId)
            .eq('is_upcoming', false)
            .or(`exam_date.gte.${since90ISODate},created_at.gte.${since90ISODateTime}`)
            .order('exam_date', { ascending: true })
            .returns<Array<Pick<ExamLog, 'created_at' | 'exam_date' | 'is_upcoming'>>>(),
          supabase
            .from('engagement_events')
            .select('occurred_at')
            .eq('user_id', userId)
            .gte('occurred_at', since90ISODateTime)
            .order('occurred_at', { ascending: true })
            .returns<Array<Pick<EngagementEvent, 'occurred_at'>>>(),
        ])

        if (!isActive) {
          return
        }

        const studyError =
          studyRes.status === 'rejected'
            ? 'No se pudieron cargar las sesiones de estudio.'
            : studyRes.value.error?.message
        const habitsError =
          habitsRes.status === 'rejected'
            ? 'No se pudieron cargar los hábitos.'
            : habitsRes.value.error?.message
        const habitLogsError =
          habitLogsRes.status === 'rejected'
            ? 'No se pudieron cargar los registros de hábitos.'
            : habitLogsRes.value.error?.message
        const examsError =
          examsRes.status === 'rejected'
            ? 'No se pudieron cargar los exámenes próximos.'
            : examsRes.value.error?.message
        const examActivityError =
          examActivityRes.status === 'rejected'
            ? 'No se pudo cargar la actividad de exámenes.'
            : examActivityRes.value.error?.message

        const primaryError = studyError ?? habitsError ?? habitLogsError ?? examsError ?? examActivityError

        setError(primaryError ?? null)

        setStudyRows90(studyRes.status === 'fulfilled' ? (studyRes.value.data ?? []) : [])
        setHabits(habitsRes.status === 'fulfilled' ? (habitsRes.value.data ?? []) : [])
        setHabitLogs90(habitLogsRes.status === 'fulfilled' ? (habitLogsRes.value.data ?? []) : [])
        setUpcomingExams(examsRes.status === 'fulfilled' ? (examsRes.value.data ?? []) : [])
        setExamActivityRows90(examActivityRes.status === 'fulfilled' ? (examActivityRes.value.data ?? []) : [])

        if (engagementRes.status === 'rejected') {
          console.warn('No se pudo consultar engagement_events para analíticas:', engagementRes.reason)
          setEngagementAvailable(false)
          setEngagementRows90([])
        } else if (engagementRes.value.error) {
          const code = getPostgresErrorCode(engagementRes.value.error)
          const isMissingTable = code === '42P01'

          if (!isMissingTable) {
            console.warn('No se pudo consultar engagement_events para analíticas:', engagementRes.value.error)
          }

          setEngagementAvailable(false)
          setEngagementRows90([])
        } else {
          setEngagementAvailable(true)
          setEngagementRows90(engagementRes.value.data ?? [])
        }
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error('Error inesperado cargando analíticas:', loadError)
        setError('No se pudieron cargar las analíticas.')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      isActive = false
    }
  }, [reloadSeed, userId])

  const activitySummary = useMemo<ActivitySummary>(() => {
    const activeDates = uniqueDateSetFromActivity(engagementRows90, studyRows90, habitLogs90, examActivityRows90)
    const today = startOfDay(new Date())

    const from7 = new Date(today)
    from7.setDate(from7.getDate() - 6)

    const from30 = new Date(today)
    from30.setDate(from30.getDate() - 29)

    const from90 = new Date(today)
    from90.setDate(from90.getDate() - 89)

    const prev30Start = new Date(today)
    prev30Start.setDate(prev30Start.getDate() - 59)
    const prev30End = new Date(today)
    prev30End.setDate(prev30End.getDate() - 30)

    const activeDays7 = computeActiveDaysInRange(activeDates, toISODate(from7), toISODate(today))
    const activeDays30 = computeActiveDaysInRange(activeDates, toISODate(from30), toISODate(today))
    const activeDays90 = computeActiveDaysInRange(activeDates, toISODate(from90), toISODate(today))
    const previous30ActiveDays = computeActiveDaysInRange(activeDates, toISODate(prev30Start), toISODate(prev30End))

    let weeklyActiveCount12 = 0
    for (let i = 0; i < 12; i += 1) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - i * 7 - 6)
      const weekEnd = new Date(today)
      weekEnd.setDate(today.getDate() - i * 7)
      const weekActive = computeActiveDaysInRange(activeDates, toISODate(weekStart), toISODate(weekEnd))
      if (weekActive > 0) weeklyActiveCount12 += 1
    }

    return {
      activeDays7,
      activeDays30,
      activeDays90,
      previous30ActiveDays,
      weeklyActiveCount12,
    }
  }, [engagementRows90, examActivityRows90, habitLogs90, studyRows90])

  const studySummary = useMemo<StudySummary>(() => {
    const last30Set = new Set(getLastDays(30))
    const rows30 = studyRows90.filter((row) => last30Set.has(row.completed_at.slice(0, 10)))
    const totalMinutes30 = rows30.reduce((sum, row) => sum + Math.round((row.duration_seconds ?? 0) / 60), 0)
    const sessions30 = rows30.length

    return {
      sessions30,
      totalMinutes30,
      averageMinutes30: sessions30 > 0 ? Math.round(totalMinutes30 / sessions30) : 0,
    }
  }, [studyRows90])

  const studySeries30 = useMemo<StudyDailyPoint[]>(() => {
    const days = getLastDays(30)

    return days.map((day) => {
      const dayMinutes = studyRows90
        .filter((row) => row.completed_at.startsWith(day))
        .reduce((sum, row) => sum + Math.round((row.duration_seconds ?? 0) / 60), 0)

      return {
        day: shortDayLabel(day),
        minutos: dayMinutes,
      }
    })
  }, [studyRows90])

  const habitFrequency30 = useMemo<HabitFrequencyItem[]>(() => {
    const last30 = new Set(getLastDays(30))
    const uniqueHabitDay = new Set(
      habitLogs90
        .filter((log) => last30.has(log.log_date))
        .map((log) => `${log.habit_id}:${log.log_date}`)
    )

    return habits
      .map((habit) => {
        const completions30 = [...uniqueHabitDay].filter((key) => key.startsWith(`${habit.id}:`)).length
        const weeklyAverage = Number((completions30 / 4.2857).toFixed(1))
        const completionRate = Math.round((completions30 / 30) * 100)

        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          completions30,
          weeklyAverage,
          completionRate,
        }
      })
      .sort((a, b) => b.completions30 - a.completions30)
  }, [habitLogs90, habits])

  const heatmap90 = useMemo<HeatmapCell[]>(() => {
    const days = getLastDays(90)
    const dayCount = new Map<string, number>()

    const uniqueHabitDay = new Set(habitLogs90.map((log) => `${log.habit_id}:${log.log_date}`))
    uniqueHabitDay.forEach((key) => {
      const day = key.split(':')[1]
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1)
    })

    const maxPerDay = Math.max(1, habits.length)

    return days.map((day) => {
      const count = dayCount.get(day) ?? 0
      const ratio = count / maxPerDay
      let level: HeatmapCell['level'] = 0

      if (ratio > 0.75) level = 4
      else if (ratio > 0.5) level = 3
      else if (ratio > 0.25) level = 2
      else if (ratio > 0) level = 1

      return { day, count, level }
    })
  }, [habitLogs90, habits.length])

  const habitHeatmapWeeks = useMemo(() => groupByWeeks(heatmap90.map((cell) => cell.day)), [heatmap90])
  const heatmapByDate = useMemo(() => new Map(heatmap90.map((cell) => [cell.day, cell])), [heatmap90])

  const retentionDelta = useMemo(() => {
    const current = activitySummary.activeDays30
    const previous = activitySummary.previous30ActiveDays
    if (previous === 0) return null
    return Math.round(((current - previous) / previous) * 100)
  }, [activitySummary.activeDays30, activitySummary.previous30ActiveDays])

  const hasAnyData =
    studyRows90.length > 0
    || habitLogs90.length > 0
    || upcomingExams.length > 0
    || examActivityRows90.length > 0
    || engagementRows90.length > 0

  if (!userId) {
    return (
      <div className="rounded-3xl border border-purple-200 bg-white p-5">
        <h1 className="text-2xl font-black text-purple-950">Analíticas</h1>
        <p className="mt-2 text-sm font-semibold text-purple-700">Inicia sesión para ver tus métricas de estudio y hábitos.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-black text-purple-950">Analíticas</h1>
        <p className="mt-2 text-sm font-semibold text-purple-700">Cargando métricas...</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-3xl border border-purple-100 bg-purple-50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-5">
        <h1 className="text-2xl font-black text-purple-950">Analíticas</h1>
        <p className="mt-2 text-sm font-semibold text-red-600">No se pudieron cargar las métricas: {error}</p>
        <button
          type="button"
          onClick={() => setReloadSeed((prev) => prev + 1)}
          className="mt-3 rounded-2xl bg-red-100 px-4 py-2 text-sm font-bold text-red-800"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Analíticas</h1>
      <p className="mt-1 text-sm text-purple-700">Tu actividad, constancia y enfoque en una sola vista.</p>
      <p className="mt-1 text-xs font-semibold text-purple-500">
        Fuente de actividad base: {engagementAvailable ? 'engagement_events + eventos de estudio/hábitos/exámenes' : 'eventos de estudio/hábitos/exámenes (fallback)'}
      </p>

      {!hasAnyData ? (
        <div className="mt-6 rounded-3xl border border-purple-200 bg-purple-50 p-5">
          <p className="text-sm font-semibold text-purple-800">
            Todavía no hay actividad suficiente para mostrar analíticas. Completa una sesión de estudio o registra un hábito para empezar.
          </p>
        </div>
      ) : null}

      <section className="mt-6 rounded-3xl border border-indigo-200 bg-white p-4">
        <h2 className="text-lg font-black text-indigo-950">Actividad y retención</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-indigo-50 p-3">
            <p className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700"><Flame className="h-3.5 w-3.5" /> Activa 7 días</p>
            <p className="text-2xl font-black text-indigo-950">{activitySummary.activeDays7}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3">
            <p className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"><TrendingUp className="h-3.5 w-3.5" /> Activa 30 días</p>
            <p className="text-2xl font-black text-blue-950">{activitySummary.activeDays30}</p>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-3">
            <p className="text-xs font-bold text-cyan-700">Activa 90 días</p>
            <p className="text-2xl font-black text-cyan-950">{activitySummary.activeDays90}</p>
          </div>
          <div className="rounded-2xl bg-violet-50 p-3">
            <p className="text-xs font-bold text-violet-700">Semanas activas (12)</p>
            <p className="text-2xl font-black text-violet-950">{activitySummary.weeklyActiveCount12}</p>
          </div>
          <div className="rounded-2xl bg-fuchsia-50 p-3">
            <p className="text-xs font-bold text-fuchsia-700">Retención vs 30 previos</p>
            <p className="text-2xl font-black text-fuchsia-950">{retentionDelta === null ? 'N/A' : `${retentionDelta}%`}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-blue-200 bg-white p-4">
        <h2 className="text-lg font-black text-blue-950">Estudio 30 días</h2>
        {studySummary.sessions30 === 0 ? (
          <p className="mt-3 text-sm font-semibold text-blue-700">Aún no hay sesiones de estudio en los últimos 30 días.</p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-blue-50 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"><GraduationCap className="h-3.5 w-3.5" /> Sesiones</p>
                <p className="text-2xl font-black text-blue-950">{studySummary.sessions30}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"><Clock3 className="h-3.5 w-3.5" /> Tiempo total</p>
                <p className="text-2xl font-black text-sky-950">{Math.round(studySummary.totalMinutes30 / 60)} h</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-3">
                <p className="text-xs font-bold text-cyan-700">Promedio por sesión</p>
                <p className="text-2xl font-black text-cyan-950">{studySummary.averageMinutes30} min</p>
              </div>
            </div>

            <div className="mt-4 h-72 rounded-2xl border border-blue-100 bg-blue-50/50 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studySeries30}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" interval={4} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="minutos" stroke="#2563eb" fill="#bfdbfe" fillOpacity={0.55} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-yellow-200 bg-white p-4">
        <h2 className="text-lg font-black text-yellow-950">Próximos exámenes</h2>
        {upcomingExams.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-yellow-800">No tienes exámenes próximos registrados.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {upcomingExams.map((exam) => {
              const today = toISODate(startOfDay(new Date()))
              const daysLeft = Math.round(
                (new Date(`${exam.exam_date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime())
                / (1000 * 60 * 60 * 24)
              )

              return (
                <article key={exam.id} className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3">
                  <p className="text-sm font-extrabold text-yellow-900">{exam.subject}</p>
                  <p className="text-xs font-semibold text-yellow-700">{formatDateLong(exam.exam_date)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-yellow-900">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {daysLeft <= 0 ? 'Hoy' : `En ${daysLeft} días`}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-4">
        <h2 className="text-lg font-black text-emerald-950">Hábitos</h2>

        {habits.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-emerald-700">No hay hábitos creados todavía.</p>
        ) : (
          <>
            <h3 className="mt-3 text-sm font-bold text-emerald-800">Frecuencia (30 días)</h3>
            {habitFrequency30.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-emerald-700">Sin registros de hábitos en los últimos 30 días.</p>
            ) : (
              <>
                <div className="mt-2 h-72 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitFrequency30.slice(0, 8)}>
                      <CartesianGrid stroke="#D1D5DB" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={{ stroke: '#CBD5E1' }}
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#ECFDF5' }}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D1FAE5',
                          borderRadius: 12,
                        }}
                        labelStyle={{ color: '#064E3B', fontWeight: 700 }}
                        itemStyle={{ color: '#065F46', fontWeight: 600 }}
                      />
                      <Bar dataKey="completions30" radius={[8, 8, 0, 0]}>
                        {habitFrequency30.slice(0, 8).map((habit) => (
                          <Cell key={habit.id} fill={resolveHabitBarColor(habit.color)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-2">
                  {habitFrequency30.slice(0, 6).map((habit) => (
                    <div key={habit.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
                      <p className="text-sm font-extrabold text-emerald-950">{habit.name}</p>
                      <p className="text-xs font-semibold text-emerald-700">
                        {habit.completions30} registros en 30 días · {habit.weeklyAverage} por semana · {habit.completionRate}% de constancia
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3 className="mt-4 text-sm font-bold text-emerald-800">Heatmap de hábitos (90 días)</h3>
            {habitLogs90.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-emerald-700">Aún no hay registros para construir el heatmap.</p>
            ) : (
              <div className="mt-2 overflow-x-auto rounded-2xl border border-emerald-100 bg-emerald-50/40 px-3 py-4">
                <div className="mx-auto inline-flex min-w-max gap-1.5">
                  {habitHeatmapWeeks.map((week, weekIndex) => (
                    <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1.5">
                      {week.map((day) => {
                        const cell = heatmapByDate.get(day)
                        const color = HEAT_LEVEL_COLORS[cell?.level ?? 0]
                        const count = cell?.count ?? 0

                        return (
                          <span
                            key={day}
                            className="h-3.5 w-3.5 rounded-[4px]"
                            style={{ backgroundColor: color }}
                            title={`${day}: ${count} hábitos completados`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>Menor</span>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className="h-3.5 w-3.5 rounded-[4px]"
                      style={{ backgroundColor: HEAT_LEVEL_COLORS[level as HeatmapCell['level']] }}
                    />
                  ))}
                  <span>Mayor</span>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
