import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

type StudySessionRow = {
  subject: string
  duration_seconds: number
  completed_at: string
}

type HabitRow = {
  id: string
  name: string
  color: string
}

type HabitLogRow = {
  habit_id: string
  log_date: string
}

type MoodRow = {
  mood: number
  logged_date: string
}

type DailyPoints = {
  week: string
  points: number
}

const SUBJECT_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b', '#10b981', '#f97316', '#6366f1']

function startOfDay(date: Date): Date {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getLastDays(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    return toISODate(startOfDay(date))
  })
}

function shortDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  const day = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date)
  const dayNumber = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(date)
  return `${day.slice(0, 2)} ${dayNumber}`
}

export function AnalyticsPage() {
  const { session } = useSession()
  const userId = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [studyRows, setStudyRows] = useState<StudySessionRow[]>([])
  const [habits, setHabits] = useState<HabitRow[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLogRow[]>([])
  const [moodRows, setMoodRows] = useState<MoodRow[]>([])
  const [weeklyPoints, setWeeklyPoints] = useState<DailyPoints[]>([])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      setError(null)

      const since30 = new Date()
      since30.setDate(since30.getDate() - 30)
      const since30ISO = since30.toISOString()
      const since8Weeks = new Date()
      since8Weeks.setDate(since8Weeks.getDate() - 56)
      const since8WeeksISO = since8Weeks.toISOString()

      const [studyRes, habitsRes, habitLogsRes, moodRes, sessionsPointsRes, routinePointsRes, gratitudePointsRes] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('subject, duration_seconds, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', since30ISO),
        supabase.from('habits').select('id, name, color').eq('user_id', userId),
        supabase
          .from('habit_logs')
          .select('habit_id, log_date')
          .eq('user_id', userId)
          .gte('log_date', toISODate(since30)),
        supabase
          .from('mood_logs')
          .select('mood, logged_date')
          .eq('user_id', userId)
          .gte('logged_date', toISODate(since30))
          .order('logged_date', { ascending: true }),
        supabase
          .from('study_sessions')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', since8WeeksISO),
        supabase
          .from('routine_logs')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', since8WeeksISO),
        supabase
          .from('gratitude_logs')
          .select('logged_date')
          .eq('user_id', userId)
          .gte('logged_date', toISODate(since8Weeks)),
      ])

      if (studyRes.error || habitsRes.error || habitLogsRes.error || moodRes.error || sessionsPointsRes.error || routinePointsRes.error || gratitudePointsRes.error) {
        setError('No se pudieron cargar las analíticas')
      } else {
        setStudyRows((studyRes.data as StudySessionRow[] | null) ?? [])
        setHabits((habitsRes.data as HabitRow[] | null) ?? [])
        setHabitLogs((habitLogsRes.data as HabitLogRow[] | null) ?? [])
        setMoodRows((moodRes.data as MoodRow[] | null) ?? [])

        const weekly = new Map<string, number>()
        const addWeekPoints = (dateStr: string, points: number) => {
          const date = new Date(dateStr)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay() + 1)
          const key = toISODate(startOfDay(weekStart))
          weekly.set(key, (weekly.get(key) ?? 0) + points)
        }

        ;((sessionsPointsRes.data as Array<{ completed_at: string }> | null) ?? []).forEach((row) => {
          addWeekPoints(row.completed_at, 5)
        })
        ;((routinePointsRes.data as Array<{ completed_at: string }> | null) ?? []).forEach((row) => {
          addWeekPoints(row.completed_at, 10)
        })
        ;((gratitudePointsRes.data as Array<{ logged_date: string }> | null) ?? []).forEach((row) => {
          addWeekPoints(`${row.logged_date}T00:00:00`, 3)
        })

        const orderedWeekly = [...weekly.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-8)
          .map(([week, points]) => ({
            week: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(`${week}T00:00:00`)),
            points,
          }))

        setWeeklyPoints(orderedWeekly)
      }

      setLoading(false)
    }

    void loadData()
  }, [userId])

  const studyByDay = useMemo(() => {
    const last14 = getLastDays(14)
    const subjects = [...new Set(studyRows.map((row) => row.subject))]

    return last14.map((day) => {
      const perSubject: Record<string, number> = {}
      let total = 0

      for (const row of studyRows) {
        if (!row.completed_at.startsWith(day)) continue
        const minutes = Math.round((row.duration_seconds ?? 0) / 60)
        perSubject[row.subject] = (perSubject[row.subject] ?? 0) + minutes
        total += minutes
      }

      return {
        day,
        label: shortDayLabel(day),
        total,
        ...perSubject,
      }
    })
  }, [studyRows])

  const studyBySubject = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of studyRows) {
      map.set(row.subject, (map.get(row.subject) ?? 0) + Math.round((row.duration_seconds ?? 0) / 60))
    }

    return [...map.entries()].map(([subject, minutes], index) => ({
      subject,
      minutes,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    }))
  }, [studyRows])

  const studyStats = useMemo(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    const mondayISO = toISODate(startOfDay(monday))

    const thisWeekMinutes = studyRows
      .filter((row) => row.completed_at.slice(0, 10) >= mondayISO)
      .reduce((sum, row) => sum + Math.round((row.duration_seconds ?? 0) / 60), 0)

    const topSubject = studyBySubject.sort((a, b) => b.minutes - a.minutes)[0]?.subject ?? 'Sin datos'
    const sessionsThisMonth = studyRows.length

    const uniqueDays = [...new Set(studyRows.map((row) => row.completed_at.slice(0, 10)))].sort((a, b) => b.localeCompare(a))
    let streak = 0
    if (uniqueDays.length > 0) {
      const current = new Date(`${uniqueDays[0]}T00:00:00`)
      for (const day of uniqueDays) {
        const expected = toISODate(current)
        if (day !== expected) break
        streak += 1
        current.setDate(current.getDate() - 1)
      }
    }

    return {
      totalHoursWeek: (thisWeekMinutes / 60).toFixed(1),
      topSubject,
      streak,
      sessionsThisMonth,
    }
  }, [studyRows, studyBySubject])

  const habitsStats = useMemo(() => {
    const last30 = getLastDays(30)
    const daysSet = new Set(last30)

    const logsInRange = habitLogs.filter((log) => daysSet.has(log.log_date))

    let bestHabit = 'Sin datos'
    let bestRate = 0

    for (const habit of habits) {
      const count = logsInRange.filter((log) => log.habit_id === habit.id).length
      const completion = Math.round((count / Math.max(1, last30.length)) * 100)
      if (completion > bestRate) {
        bestRate = completion
        bestHabit = habit.name
      }
    }

    let perfectDays = 0
    for (const day of last30) {
      const dayCount = logsInRange.filter((log) => log.log_date === day).length
      if (habits.length > 0 && dayCount >= habits.length) perfectDays += 1
    }

    const average = habits.length > 0
      ? Math.round((logsInRange.length / (habits.length * last30.length)) * 100)
      : 0

    return { bestHabit, bestRate, perfectDays, average }
  }, [habitLogs, habits])

  const habitHeatmapDays = useMemo(() => getLastDays(30), [])

  const moodSeries = useMemo(() => moodRows.map((row) => ({
    day: shortDayLabel(row.logged_date),
    mood: row.mood,
    logged_date: row.logged_date,
  })), [moodRows])

  const moodStats = useMemo(() => {
    if (moodRows.length === 0) {
      return {
        average: '0.0',
        lowDay: 'Sin datos',
        coverage: '0/0',
      }
    }

    const average = (moodRows.reduce((sum, row) => sum + row.mood, 0) / moodRows.length).toFixed(1)

    const lowRows = moodRows.filter((row) => row.mood <= 2)
    const lowWeekdays = new Map<string, number>()
    lowRows.forEach((row) => {
      const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(new Date(`${row.logged_date}T00:00:00`))
      lowWeekdays.set(weekday, (lowWeekdays.get(weekday) ?? 0) + 1)
    })
    const lowDay = [...lowWeekdays.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin patrón claro'

    const monthDays = new Date().getDate()

    return {
      average,
      lowDay,
      coverage: `${moodRows.length}/${monthDays}`,
    }
  }, [moodRows])

  const moodColor = (value: number): string => {
    if (value <= 2) return '#f97316'
    if (value === 3) return '#f59e0b'
    if (value >= 4) return '#ec4899'
    return '#94a3b8'
  }

  if (loading) {
    return <p className="text-sm font-semibold text-purple-700">Cargando analíticas...</p>
  }

  if (error) {
    return <p className="text-sm font-semibold text-red-600">{error}</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Analíticas</h1>
      <p className="mt-1 text-sm text-purple-700">Tu progreso en estudio, hábitos, ánimo y puntos en una sola vista.</p>

      <section className="mt-6 rounded-3xl border border-blue-200 bg-white p-4">
        <h2 className="text-lg font-black text-blue-950">Estudio</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-blue-50 p-3"><p className="text-xs font-bold text-blue-700">Horas esta semana</p><p className="text-2xl font-black text-blue-950">{studyStats.totalHoursWeek}</p></div>
          <div className="rounded-2xl bg-purple-50 p-3"><p className="text-xs font-bold text-purple-700">Materia top</p><p className="text-lg font-black text-purple-950">{studyStats.topSubject}</p></div>
          <div className="rounded-2xl bg-orange-50 p-3"><p className="text-xs font-bold text-orange-700">Racha actual</p><p className="text-2xl font-black text-orange-950">{studyStats.streak}</p></div>
          <div className="rounded-2xl bg-pink-50 p-3"><p className="text-xs font-bold text-pink-700">Sesiones mes</p><p className="text-2xl font-black text-pink-950">{studyStats.sessionsThisMonth}</p></div>
        </div>

        <div className="mt-4 h-72 rounded-2xl border border-blue-100 bg-blue-50/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studyByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              {[...new Set(studyRows.map((row) => row.subject))].map((subject, index) => (
                <Bar key={subject} dataKey={subject} stackId="study" fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 h-72 rounded-2xl border border-pink-100 bg-pink-50/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={studyBySubject} dataKey="minutes" nameKey="subject" cx="50%" cy="45%" outerRadius={90} label>
                {studyBySubject.map((entry) => (
                  <Cell key={entry.subject} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-4">
        <h2 className="text-lg font-black text-emerald-950">Hábitos</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700">Más consistente</p><p className="text-base font-black text-emerald-950">{habitsStats.bestHabit} ({habitsStats.bestRate}%)</p></div>
          <div className="rounded-2xl bg-teal-50 p-3"><p className="text-xs font-bold text-teal-700">Días perfectos</p><p className="text-2xl font-black text-teal-950">{habitsStats.perfectDays}</p></div>
          <div className="rounded-2xl bg-lime-50 p-3"><p className="text-xs font-bold text-lime-700">Promedio mensual</p><p className="text-2xl font-black text-lime-950">{habitsStats.average}%</p></div>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
          {habits.map((habit) => (
            <div key={habit.id} className="grid items-center gap-2" style={{ gridTemplateColumns: '140px repeat(30, minmax(0,1fr))' }}>
              <span className="text-xs font-bold text-emerald-900">{habit.name}</span>
              {habitHeatmapDays.map((day) => {
                const completed = habitLogs.some((log) => log.habit_id === habit.id && log.log_date === day)
                return (
                  <span
                    key={`${habit.id}-${day}`}
                    className={`h-4 w-4 rounded-full ${completed ? '' : 'bg-gray-100'}`}
                    style={completed ? { backgroundColor: habit.color } : undefined}
                    title={`${habit.name} • ${day}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-rose-200 bg-white p-4">
        <h2 className="text-lg font-black text-rose-950">Estado de ánimo</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-rose-50 p-3"><p className="text-xs font-bold text-rose-700">Promedio del mes</p><p className="text-2xl font-black text-rose-950">{moodStats.average}</p></div>
          <div className="rounded-2xl bg-orange-50 p-3"><p className="text-xs font-bold text-orange-700">Día con ánimo bajo</p><p className="text-base font-black text-orange-950">{moodStats.lowDay}</p></div>
          <div className="rounded-2xl bg-pink-50 p-3"><p className="text-xs font-bold text-pink-700">Registros</p><p className="text-2xl font-black text-pink-950">{moodStats.coverage}</p></div>
        </div>

        <div className="mt-4 h-72 rounded-2xl border border-rose-100 bg-rose-50/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={moodSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip />
              <Area type="monotone" dataKey="mood" stroke="#ec4899" fill="#fbcfe8" fillOpacity={0.45} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {moodSeries.map((item) => (
            <span key={item.logged_date} className="h-3 w-3 rounded-full" style={{ backgroundColor: moodColor(item.mood) }} title={`${item.day}: ${item.mood}`} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-yellow-200 bg-white p-4">
        <h2 className="text-lg font-black text-yellow-950">Gamificación</h2>
        <div className="mt-4 h-72 rounded-2xl border border-yellow-100 bg-yellow-50/50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#eab308" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
