import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import type { StudyBlock, RoutineWithExercises } from '@/types/database'
import { MochiCharacter } from '@/components/MochiCharacter'
import { DailyMotivation } from '@/components/DailyMotivation'

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

type AnimatedDashboardCardProps = {
  children: React.ReactNode
  delay: number
  animationSeed: number
  className: string
}

function AnimatedDashboardCard({ children, delay, animationSeed, className }: AnimatedDashboardCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)

  useEffect(() => {
    opacity.value = 0
    translateY.value = 16

    opacity.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }))
  }, [animationSeed, delay, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }
  })

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  )
}

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
  const [animationSeed, setAnimationSeed] = useState(0)

  const loadingScale = useSharedValue(1)

  useEffect(() => {
    if (loading) {
      loadingScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 650, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
      return
    }

    loadingScale.value = withTiming(1, { duration: 180 })
  }, [loading, loadingScale])

  const loadingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: loadingScale.value }],
    }
  })

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

        setAnimationSeed((prev) => prev + 1)
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
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-3xl font-extrabold text-blue-900">Hola, {userName}</Text>
          <Text className="mt-1 text-sm font-semibold capitalize text-blue-700">{today}</Text>
        </View>
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-blue-200"
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={18} color="#1e40af" />
        </TouchableOpacity>
      </View>

      <View className="mt-4">
        <DailyMotivation
          userName={userName}
          studyBlockCount={todayBlocks.length}
          hasRoutine={!!todayRoutine}
        />
      </View>

      <AnimatedDashboardCard
        delay={0}
        animationSeed={animationSeed}
        className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-5"
      >
        <View className="mb-3 flex-row items-center">
          <Ionicons name="book" size={18} color="#1e40af" />
          <Text className="ml-2 text-base font-bold text-blue-900">Bloques de estudio</Text>
        </View>

        {loading ? (
          <View className="items-center py-6">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={82} />
            </Animated.View>
            <Text className="mt-3 text-sm font-semibold text-blue-700">Cargando tu agenda...</Text>
          </View>
        ) : error ? (
          <Text className="text-sm font-semibold text-red-600">{error}</Text>
        ) : todayBlocks.length === 0 ? (
          <View className="items-center py-2">
            <MochiCharacter mood="sleepy" size={78} />
            <Text className="mt-3 text-sm font-semibold text-slate-500">No hay bloques para este día</Text>
          </View>
        ) : (
          todayBlocks.map((block) => (
            <TouchableOpacity
              key={block.id}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
              onPress={() => router.push(`/study-timer?blockId=${block.id}`)}
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
            </TouchableOpacity>
          ))
        )}
      </AnimatedDashboardCard>

      <TouchableOpacity
        className="mt-4 flex-row items-center justify-center rounded-2xl border-2 border-pink-300 bg-pink-200 py-4"
        onPress={() => router.push('/exam-log')}
      >
        <Ionicons name="document-text" size={18} color="#9d174d" />
        <Text className="ml-2 font-bold text-pink-900">Registrar examen</Text>
      </TouchableOpacity>

      <AnimatedDashboardCard
        delay={100}
        animationSeed={animationSeed}
        className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-5"
      >
        <View className="mb-2 flex-row items-center">
          <Ionicons name="barbell" size={18} color="#0d9488" />
          <Text className="ml-2 text-base font-bold text-blue-900">Rutina de hoy</Text>
        </View>
        {loading ? (
          <View className="items-center py-6">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={82} />
            </Animated.View>
            <Text className="mt-3 text-sm font-semibold text-teal-700">Preparando tus rutinas...</Text>
          </View>
        ) : todayRoutine ? (
          <>
            <Text className="text-sm font-bold text-slate-800">{todayRoutine.name}</Text>
            <Text className="mt-1 text-xs font-semibold text-teal-700">
              {todayRoutine.routine_exercises.length} ejercicios • {handleTotalTime(todayRoutine)}
            </Text>
            <TouchableOpacity
              className="mt-3 items-center rounded-2xl border border-teal-200 bg-teal-100 py-3"
              onPress={() => router.push(`/routine-player?routineId=${todayRoutine.id}`)}
            >
              <Text className="font-bold text-teal-800">Iniciar rutina</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="items-center py-2">
            <MochiCharacter mood="happy" size={78} />
            <Text className="mt-3 text-sm font-semibold text-slate-500">Crea tu primera rutina</Text>
          </View>
        )}
      </AnimatedDashboardCard>

      <AnimatedDashboardCard
        delay={200}
        animationSeed={animationSeed}
        className="mb-12 mt-4 rounded-3xl border border-purple-100 bg-white p-4"
      >
        <Text className="text-xs font-semibold text-purple-800">Sesión activa: {email ?? 'sin correo'}</Text>
        <TouchableOpacity className="mt-3 items-center rounded-2xl bg-purple-200 py-3" onPress={onSignOut}>
          <Text className="font-bold text-purple-900">Cerrar sesión</Text>
        </TouchableOpacity>
      </AnimatedDashboardCard>
    </ScrollView>
  )
}

export default HomeDashboard