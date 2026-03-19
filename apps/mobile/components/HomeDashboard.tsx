import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import type { StudyBlock, RoutineWithExercises } from '@/types/database'

type HomeDashboardProps = {
  userName: string
  email: string | undefined
  onSignOut: () => void
}

const colorMap: Record<string, string> = {
  pink: 'bg-pink-200',
  blue: 'bg-blue-200',
  yellow: 'bg-yellow-200',
  teal: 'bg-teal-200',
  purple: 'bg-purple-200',
  green: 'bg-green-200',
}

const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function HomeDashboard({ userName, email, onSignOut }: HomeDashboardProps) {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  const [todayBlocks, setTodayBlocks] = useState<StudyBlock[]>([])
  const [todayRoutine, setTodayRoutine] = useState<RoutineWithExercises | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTodayData() {
      try {
        setLoading(true)
        setError(null)

        const session = await supabase.auth.getSession()
        if (!session.data.session?.user.id) return

        const userId = session.data.session.user.id
        const todayDayOfWeek = new Date().getDay()

        // Load today's study blocks
        const { data: blocksData, error: blocksError } = await supabase
          .from('study_blocks')
          .select('*')
          .eq('user_id', userId)
          .eq('day_of_week', todayDayOfWeek)
          .order('start_time', { ascending: true })

        if (blocksError) throw blocksError
        setTodayBlocks(blocksData ?? [])

        // Load today's routine
        const { data: routinesData, error: routinesError } = await supabase
          .from('routines')
          .select(
            `*,
             routine_exercises (
               id,
               routine_id,
               exercise_id,
               order_index,
               exercise:exercises (id, name, sets, reps, duration_seconds, notes)
             )`
          )
          .eq('user_id', userId)
          .limit(1)

        if (routinesError) throw routinesError

        if (routinesData && routinesData.length > 0) {
          const routine = routinesData[0]
          // Check if routine is for today
          if (routine.days.includes(todayDayOfWeek)) {
            setTodayRoutine(routine)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos')
      } finally {
        setLoading(false)
      }
    }

    loadTodayData()
  }, [])

  const handleTotalTime = (routine: RoutineWithExercises): string => {
    const totalSeconds = routine.routine_exercises.reduce((sum, re) => {
      return sum + (re.exercise?.duration_seconds ?? 0)
    }, 0)
    const minutes = Math.ceil(totalSeconds / 60)
    return `${minutes} min`
  }

  return (
    <ScrollView className="flex-1 bg-blue-100 px-5 pt-12">
      <Animated.View entering={FadeIn.delay(0)}>
        <Text className="text-3xl font-extrabold text-blue-900">Hola, {userName}</Text>
        <Text className="mt-1 text-sm font-semibold capitalize text-blue-700">{today}</Text>
      </Animated.View>

      {/* Study blocks section */}
      <Animated.View entering={FadeIn.delay(100)} className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-5">
        <View className="mb-3 flex-row items-center">
          <Ionicons name="book" size={18} color="#1e40af" />
          <Text className="ml-2 text-base font-bold text-blue-900">Bloques de estudio</Text>
        </View>

        {loading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : error ? (
          <Text className="text-sm font-semibold text-red-600">{error}</Text>
        ) : todayBlocks.length === 0 ? (
          <Text className="text-sm font-semibold text-slate-500">No hay bloques para hoy</Text>
        ) : (
          todayBlocks.map((block, index) => (
            <Animated.View
              key={block.id}
              entering={FadeIn.delay(200 + index * 50)}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <View className="flex-row items-center">
                <View
                  className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${colorMap[block.color] || 'bg-purple-200'}`}
                >
                  <Text className="text-xs font-extrabold text-slate-700">{block.subject[0]}</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800">{block.subject}</Text>
                  <Text className="text-xs font-semibold text-slate-500">
                    {block.start_time} - {block.end_time}
                  </Text>
                </View>
              </View>
              <View className="rounded-full bg-white px-3 py-1">
                <Text className="text-xs font-bold text-slate-600">
                  {(() => {
                    const start = parseInt(block.start_time.split(':')[0])
                    const end = parseInt(block.end_time.split(':')[0])
                    const duration = end - start
                    return `${duration}h`
                  })()}
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </Animated.View>

      {/* Routine section */}
      <Animated.View entering={FadeIn.delay(200)} className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-5">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="barbell" size={18} color="#0d9488" />
          <Text className="ml-2 text-base font-bold text-blue-900">Rutina de hoy</Text>
        </View>
        {loading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#14b8a6" />
          </View>
        ) : todayRoutine ? (
          <>
            <Text className="text-sm font-bold text-slate-800">{todayRoutine.name}</Text>
            <Text className="mt-1 text-xs font-semibold text-teal-700">
              {todayRoutine.routine_exercises.length} ejercicios • {handleTotalTime(todayRoutine)}
            </Text>
            <TouchableOpacity className="mt-3 items-center rounded-2xl border border-teal-200 bg-teal-100 py-3">
              <Text className="font-bold text-teal-800">Iniciar rutina</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text className="text-sm font-semibold text-slate-500">Sin rutina para hoy</Text>
        )}
      </Animated.View>

      {/* Session info */}
      <Animated.View entering={FadeIn.delay(300)} className="mb-12 mt-4 rounded-3xl border border-purple-100 bg-white p-4">
        <Text className="text-xs font-semibold text-purple-800">Sesión activa: {email ?? 'sin correo'}</Text>
        <TouchableOpacity className="mt-3 items-center rounded-2xl bg-purple-200 py-3" onPress={onSignOut}>
          <Text className="font-bold text-purple-900">Cerrar sesión</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

export default HomeDashboard