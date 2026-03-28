import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import { MochiCharacter } from '@/src/shared/components/MochiCharacter'
import { useSession } from '@/src/core/providers/SessionContext'
import { supabase } from '@/src/shared/lib/supabase'
import { callAI } from '@/src/shared/lib/ai'

export function WeeklySummaryScreen() {
  const { session } = useSession()
  const userId = session?.user.id
  const captureViewRef = useRef<View | null>(null)

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({
    studyHours: 0,
    sessions: 0,
    routines: 0,
    habitsCompleted: 0,
    habitsTotal: 0,
    points: 0,
    streak: 0,
    moods: [] as Array<number | null>,
  })

  const range = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1 - 7)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      start: monday,
      end: sunday,
      startISO: monday.toISOString().slice(0, 10),
      endISO: sunday.toISOString().slice(0, 10),
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLoading(false)
        return
      }

      async function loadSummary() {
        setLoading(true)

        const nextDay = new Date(range.end)
        nextDay.setDate(nextDay.getDate() + 1)

        const [studyRes, sessionsRes, routineRes, habitsRes, habitsCountRes, gratitudeRes, streakRes, moodRes] = await Promise.all([
          supabase
            .from('study_sessions')
            .select('duration_seconds')
            .eq('user_id', userId)
            .gte('completed_at', range.start.toISOString())
            .lt('completed_at', nextDay.toISOString()),
          supabase
            .from('study_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('completed_at', range.start.toISOString())
            .lt('completed_at', nextDay.toISOString()),
          supabase
            .from('routine_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('completed_at', range.start.toISOString())
            .lt('completed_at', nextDay.toISOString()),
          supabase
            .from('habit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('log_date', range.startISO)
            .lte('log_date', range.endISO),
          supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase
            .from('gratitude_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('logged_date', range.startISO)
            .lte('logged_date', range.endISO),
          supabase.from('streaks').select('longest_streak').eq('user_id', userId).maybeSingle(),
          supabase
            .from('mood_logs')
            .select('mood, logged_date')
            .eq('user_id', userId)
            .gte('logged_date', range.startISO)
            .lte('logged_date', range.endISO),
        ])

        const studyHours = (((studyRes.data as Array<{ duration_seconds: number }> | null) ?? []).reduce((sum, row) => sum + row.duration_seconds, 0) / 3600)
        const sessions = sessionsRes.count ?? 0
        const routines = routineRes.count ?? 0
        const habitsCompleted = habitsRes.count ?? 0
        const habitsTotal = (habitsCountRes.count ?? 0) * 7
        const points = sessions * 5 + routines * 10 + (gratitudeRes.count ?? 0) * 3

        const moodMap = new Map<string, number>()
        ;((moodRes.data as Array<{ mood: number; logged_date: string }> | null) ?? []).forEach((row) => {
          moodMap.set(row.logged_date, row.mood)
        })

        const moodDots = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(range.start)
          date.setDate(range.start.getDate() + i)
          return moodMap.get(date.toISOString().slice(0, 10)) ?? null
        })

        setStats({
          studyHours: Number(studyHours.toFixed(1)),
          sessions,
          routines,
          habitsCompleted,
          habitsTotal,
          points,
          streak: (streakRes.data as { longest_streak: number } | null)?.longest_streak ?? 0,
          moods: moodDots,
        })

        const aiPrompt = `Resumen semanal de estudiante:\nHoras estudio: ${Number(studyHours.toFixed(1))}\nSesiones: ${sessions}\nRutinas: ${routines}\nHábitos: ${habitsCompleted}/${habitsTotal}\nPuntos: ${points}\nRacha: ${(streakRes.data as { longest_streak: number } | null)?.longest_streak ?? 0}\n\nEscribe un mensaje motivador de 2 a 3 líneas, cálido y en español.`

        try {
          const aiMessage = await callAI(aiPrompt)
          setMessage(aiMessage.trim())
        } catch {
          setMessage('Esta semana avanzaste con constancia. Cada paso cuenta y tu progreso se nota.')
        }

        setLoading(false)
      }

      void loadSummary()
    }, [range.end, range.endISO, range.start, range.startISO, userId])
  )

  const shareSummary = async () => {
    if (!captureViewRef.current) return
    const uri = await captureRef(captureViewRef, { format: 'png', quality: 1 })
    const canShare = await Sharing.isAvailableAsync()
    if (canShare) {
      await Sharing.shareAsync(uri)
    }
  }

  const moodClass = (mood: number | null): string => {
    if (mood === null) return 'bg-slate-200'
    if (mood <= 2) return 'bg-orange-300'
    if (mood === 3) return 'bg-yellow-300'
    return 'bg-emerald-300'
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-indigo-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-3 text-sm font-semibold text-indigo-700">Preparando tu resumen semanal...</Text>
      </SafeAreaView>
    )
  }

  const moodCharacter = stats.points >= 60 ? 'excited' : stats.points >= 25 ? 'happy' : 'thinking'

  return (
    <SafeAreaView className="flex-1 bg-indigo-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-4 rounded-3xl border border-indigo-200 bg-white p-4">
          <Text className="text-lg font-extrabold text-indigo-900">
            Tu semana del {range.startISO} al {range.endISO}
          </Text>
          <View className="mt-3 items-center">
            <MochiCharacter mood={moodCharacter} size={84} />
            <Text className="mt-3 text-center text-sm font-semibold text-indigo-700">{message}</Text>
          </View>
        </View>

        <View className="mt-4 grid gap-3">
          <View className="rounded-2xl border border-indigo-200 bg-indigo-100 p-3"><Text className="text-xs font-bold text-indigo-700">Horas de estudio</Text><Text className="text-2xl font-black text-indigo-900">{stats.studyHours}</Text></View>
          <View className="rounded-2xl border border-blue-200 bg-blue-100 p-3"><Text className="text-xs font-bold text-blue-700">Sesiones</Text><Text className="text-2xl font-black text-blue-900">{stats.sessions}</Text></View>
          <View className="rounded-2xl border border-teal-200 bg-teal-100 p-3"><Text className="text-xs font-bold text-teal-700">Rutinas</Text><Text className="text-2xl font-black text-teal-900">{stats.routines}</Text></View>
          <View className="rounded-2xl border border-green-200 bg-green-100 p-3"><Text className="text-xs font-bold text-green-700">Hábitos</Text><Text className="text-2xl font-black text-green-900">{stats.habitsCompleted}/{stats.habitsTotal}</Text></View>
          <View className="rounded-2xl border border-yellow-200 bg-yellow-100 p-3"><Text className="text-xs font-bold text-yellow-700">Puntos ganados</Text><Text className="text-2xl font-black text-yellow-900">{stats.points}</Text></View>
          <View className="rounded-2xl border border-orange-200 bg-orange-100 p-3"><Text className="text-xs font-bold text-orange-700">Racha más larga</Text><Text className="text-2xl font-black text-orange-900">{stats.streak}</Text></View>
        </View>

        <View className="mt-4 rounded-2xl border border-pink-200 bg-white p-3">
          <Text className="text-sm font-bold text-pink-800">Ánimo semanal</Text>
          <View className="mt-2 flex-row">
            {stats.moods.map((mood, index) => (
              <View key={`${index}-${mood ?? 'none'}`} className={`mr-2 h-3 w-3 rounded-full ${moodClass(mood)}`} />
            ))}
          </View>
        </View>

        <View
          ref={(node) => {
            captureViewRef.current = node
          }}
          collapsable={false}
          className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4"
        >
          <Text className="text-center text-base font-extrabold text-indigo-900">Mi semana en Mochi</Text>
          <Text className="mt-1 text-center text-xs font-semibold text-indigo-700">Semana: {range.startISO} - {range.endISO}</Text>
          <Text className="mt-2 text-center text-sm font-semibold text-indigo-900">{stats.studyHours}h estudio · {stats.sessions} sesiones · {stats.points} puntos</Text>
          <Text className="mt-2 text-center text-xs font-semibold text-indigo-600">Descarga Mochi en mochi.siramong.tech</Text>
        </View>

        <TouchableOpacity className="mb-10 mt-4 items-center rounded-2xl bg-indigo-600 py-3" onPress={() => { void shareSummary() }}>
          <Text className="font-bold text-white">Compartir resumen</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default WeeklySummaryScreen
