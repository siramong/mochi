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
import { useSession } from '@/context/SessionContext'
import type { StudyBlock, RoutineWithExercises, Recipe } from '@/types/database'
import { MochiCharacter } from '@/components/MochiCharacter'
import { DailyMotivation } from '@/components/DailyMotivation'
import { getGreeting, getTimeColor, getTimeIcon, getTimeOfDay, type TimeOfDay } from '@/lib/timeContext'

type HomeDashboardProps = {
  userName: string
  onNavigateToCooking: () => void
}

type QuickAccessItem = {
  label: string
  route: '/goals' | '/vouchers' | '/mood' | '/gratitude'
  icon: keyof typeof Ionicons.glyphMap
  cardClass: string
  iconColor: string
  textClass: string
}

const colorMap: Record<string, string> = {
  pink: 'bg-pink-200',
  blue: 'bg-blue-200',
  yellow: 'bg-yellow-200',
  teal: 'bg-teal-200',
  purple: 'bg-purple-200',
  green: 'bg-green-200',
}

const quickAccessItems: QuickAccessItem[] = [
  {
    label: 'Metas',
    route: '/goals',
    icon: 'flag-outline',
    cardClass: 'border-pink-200 bg-pink-100',
    iconColor: '#be185d',
    textClass: 'text-pink-900',
  },
  {
    label: 'Vales',
    route: '/vouchers',
    icon: 'ticket-outline',
    cardClass: 'border-yellow-200 bg-yellow-100',
    iconColor: '#92400e',
    textClass: 'text-yellow-900',
  },
  {
    label: 'Estado de ánimo',
    route: '/mood',
    icon: 'heart-outline',
    cardClass: 'border-orange-200 bg-orange-100',
    iconColor: '#c2410c',
    textClass: 'text-orange-900',
  },
  {
    label: 'Gratitud',
    route: '/gratitude',
    icon: 'flower-outline',
    cardClass: 'border-emerald-200 bg-emerald-100',
    iconColor: '#047857',
    textClass: 'text-emerald-900',
  },
]

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

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={animatedStyle} className={className}>
      {children}
    </Animated.View>
  )
}

export function HomeDashboard({ userName, onNavigateToCooking }: HomeDashboardProps) {
  const { session } = useSession()
  const todayRaw = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)
  const timeOfDay = getTimeOfDay()
  const greetingText = getGreeting(userName)
  const greetingIcon = getTimeIcon() as keyof typeof Ionicons.glyphMap
  const greetingBgClass = getTimeColor()

  const timeLabelMap: Record<TimeOfDay, string> = {
    dawn: 'Madrugada', morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche', night: 'Noche',
  }

  const [todayBlocks, setTodayBlocks] = useState<StudyBlock[]>([])
  const [todayRoutines, setTodayRoutines] = useState<RoutineWithExercises[]>([])
  const [habitCount, setHabitCount] = useState(0)
  const [habitLogsCount, setHabitLogsCount] = useState(0)
  const [latestRecipe, setLatestRecipe] = useState<Recipe | null>(null)
  const [recipeCount, setRecipeCount] = useState(0)
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
        -1, false
      )
      return
    }
    loadingScale.value = withTiming(1, { duration: 180 })
  }, [loading, loadingScale])

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingScale.value }],
  }))

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) { setLoading(false); return }

    async function loadTodayData() {
      try {
        setLoading(true)
        setError(null)

        const todayDayOfWeek = new Date().getDay()
        const todayISO = new Date().toISOString().slice(0, 10)

        const [blocksRes, routinesRes, habitsCountRes, habitsLogsRes, latestRecipeRes, recipeCountRes] =
          await Promise.all([
            supabase.from('study_blocks').select('*').eq('user_id', userId).eq('day_of_week', todayDayOfWeek).order('start_time', { ascending: true }),
            supabase.from('routines').select(`*, routine_exercises (id, routine_id, exercise_id, order_index, exercise:exercises (id, name, sets, reps, duration_seconds, notes))`).eq('user_id', userId),
            supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('log_date', todayISO),
            supabase.from('recipes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          ])

        if (blocksRes.error) throw blocksRes.error
        if (routinesRes.error) throw routinesRes.error

        setTodayBlocks(blocksRes.data ?? [])
        setTodayRoutines((routinesRes.data ?? []).filter((r) => r.days.includes(todayDayOfWeek)))
        setHabitCount(habitsCountRes.count ?? 0)
        setHabitLogsCount(habitsLogsRes.count ?? 0)
        setLatestRecipe((latestRecipeRes.data as Recipe | null) ?? null)
        setRecipeCount(recipeCountRes.count ?? 0)
        setAnimationSeed((prev) => prev + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos')
      } finally {
        setLoading(false)
      }
    }

    void loadTodayData()
  }, [session?.user.id])

  const handleTotalTime = (routine: RoutineWithExercises): string => {
    const totalSeconds = routine.routine_exercises.reduce((sum, re) => sum + (re.exercise?.duration_seconds ?? 0), 0)
    return `${Math.ceil(totalSeconds / 60)} min`
  }

  return (
    <ScrollView className="flex-1 bg-blue-100 px-5 pt-12">
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className={`flex-1 mr-3 rounded-3xl border-2 border-blue-200 px-4 py-3 ${greetingBgClass}`}>
          <View className="flex-row items-center">
            <Ionicons name={greetingIcon} size={18} color="#1e40af" />
            <Text className="ml-2 text-2xl font-extrabold text-blue-900">{greetingText}</Text>
          </View>
          <Text className="mt-1 text-sm font-semibold text-blue-700">{today}</Text>
          <View className="mt-3 self-start rounded-full border border-blue-200 bg-white/80 px-3 py-1">
            <View className="flex-row items-center">
              <Ionicons name={greetingIcon} size={12} color="#1e40af" />
              <Text className="ml-1 text-xs font-bold text-blue-800">{timeLabelMap[timeOfDay]}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-blue-200"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={18} color="#1e40af" />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-blue-200"
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person" size={18} color="#1e40af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivación */}
      <View className="mt-4">
        <DailyMotivation
          userName={userName}
          studyBlockCount={todayBlocks.length}
          hasRoutine={todayRoutines.length > 0}
          timeOfDay={timeOfDay}
        />
      </View>

      {/* Quick access */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false} className="mt-4"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        {quickAccessItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            className={`mr-3 w-20 items-center rounded-2xl border-2 px-3 py-3 ${item.cardClass}`}
            onPress={() => router.push(item.route)}
          >
            <Ionicons name={item.icon} size={20} color={item.iconColor} />
            <Text className={`mt-2 text-center text-xs font-bold ${item.textClass}`} numberOfLines={2}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hábitos */}
      <TouchableOpacity
        className="mt-4 rounded-3xl border-2 border-green-200 bg-white p-4"
        onPress={() => router.push('/habits')}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="leaf" size={18} color="#15803d" />
            <Text className="ml-2 text-base font-bold text-green-900">Hábitos de hoy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#166534" />
        </View>
        <Text className="mt-2 text-sm font-semibold text-green-700">
          {loading ? 'Cargando hábitos...' : `${habitLogsCount}/${habitCount} hábitos completados hoy`}
        </Text>
      </TouchableOpacity>

      {/* Bloques de estudio */}
      <AnimatedDashboardCard delay={0} animationSeed={animationSeed} className="mt-4 rounded-3xl border-2 border-blue-200 bg-white p-5">
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
                <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${colorMap[block.color] ?? 'bg-purple-200'}`}>
                  <Text className="text-xs font-extrabold text-slate-700">{block.subject[0]}</Text>
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800">{block.subject}</Text>
                  <Text className="text-xs font-semibold text-slate-500">{block.start_time} - {block.end_time}</Text>
                </View>
              </View>
              <View className="rounded-full bg-white px-3 py-1">
                <Text className="text-xs font-bold text-slate-600">
                  {`${parseInt(block.end_time.split(':')[0]) - parseInt(block.start_time.split(':')[0])}h`}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </AnimatedDashboardCard>

      {/* Registrar examen */}
      <TouchableOpacity
        className="mt-4 flex-row items-center justify-center rounded-2xl border-2 border-pink-300 bg-pink-200 py-4"
        onPress={() => router.push('/exam-log')}
      >
        <Ionicons name="document-text" size={18} color="#9d174d" />
        <Text className="ml-2 font-bold text-pink-900">Registrar examen</Text>
      </TouchableOpacity>

      {/* Rutinas */}
      <AnimatedDashboardCard delay={100} animationSeed={animationSeed} className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-5">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="barbell" size={18} color="#0d9488" />
          <Text className="ml-2 text-base font-bold text-blue-900">Rutinas de hoy</Text>
        </View>
        {loading ? (
          <View className="items-center py-6">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={82} />
            </Animated.View>
            <Text className="mt-3 text-sm font-semibold text-teal-700">Preparando tus rutinas...</Text>
          </View>
        ) : todayRoutines.length > 0 ? (
          todayRoutines.map((routine) => (
            <TouchableOpacity
              key={routine.id}
              className="mb-3 rounded-2xl border border-teal-200 bg-teal-50 p-3"
              onPress={() => router.push(`/routine-player?routineId=${routine.id}`)}
            >
              <Text className="text-sm font-bold text-slate-800">{routine.name}</Text>
              <Text className="mt-1 text-xs font-semibold text-teal-700">
                {routine.routine_exercises.length} ejercicios • {handleTotalTime(routine)}
              </Text>
              <View className="mt-2 self-start rounded-xl border border-teal-200 bg-white px-3 py-1">
                <Text className="text-xs font-bold text-teal-800">Iniciar rutina</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center py-2">
            <MochiCharacter mood="happy" size={78} />
            <Text className="mt-3 text-sm font-semibold text-slate-500">Crea tu primera rutina</Text>
          </View>
        )}
      </AnimatedDashboardCard>

      {/* ─── Cocina ─── */}
      <AnimatedDashboardCard delay={200} animationSeed={animationSeed} className="mt-4 rounded-3xl border-2 border-orange-200 bg-white p-5">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="restaurant" size={18} color="#c2410c" />
            <Text className="ml-2 text-base font-bold text-orange-900">Cocina</Text>
          </View>
          {recipeCount > 0 && (
            <View className="rounded-full bg-orange-100 px-3 py-1">
              <Text className="text-xs font-bold text-orange-700">
                {recipeCount} {recipeCount === 1 ? 'receta' : 'recetas'}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="items-center py-4">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={72} />
            </Animated.View>
          </View>
        ) : latestRecipe ? (
          <>
            <TouchableOpacity
              className="rounded-2xl border border-orange-200 bg-orange-50 p-3"
              onPress={() => router.push(`/recipe-detail?recipeId=${latestRecipe.id}`)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-extrabold text-orange-950" numberOfLines={1}>
                    {latestRecipe.title}
                  </Text>
                  {latestRecipe.description ? (
                    <Text className="mt-0.5 text-xs font-semibold text-orange-700" numberOfLines={1}>
                      {latestRecipe.description}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row items-center gap-1">
                  {latestRecipe.is_favorite && <Ionicons name="heart" size={14} color="#f97316" />}
                  <Ionicons name="chevron-forward" size={16} color="#c2410c" />
                </View>
              </View>
              {(latestRecipe.total_time_minutes > 0 || latestRecipe.difficulty) && (
                <View className="mt-2 flex-row gap-2">
                  {latestRecipe.total_time_minutes > 0 && (
                    <View className="flex-row items-center rounded-full bg-orange-200 px-2 py-0.5">
                      <Ionicons name="time-outline" size={11} color="#c2410c" />
                      <Text className="ml-0.5 text-xs font-bold text-orange-800">
                        {latestRecipe.total_time_minutes} min
                      </Text>
                    </View>
                  )}
                  <View className="rounded-full bg-orange-200 px-2 py-0.5">
                    <Text className="text-xs font-bold text-orange-800 capitalize">
                      {latestRecipe.difficulty}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* FIX: navega a la tab de Cocina, no a una ruta de Expo Router */}
            <TouchableOpacity
              className="mt-3 flex-row items-center justify-center rounded-2xl border border-orange-200 py-2"
              onPress={onNavigateToCooking}
            >
              <Ionicons name="restaurant-outline" size={14} color="#c2410c" />
              <Text className="ml-1.5 text-xs font-bold text-orange-700">Ver todas las recetas</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            className="items-center py-2"
            onPress={onNavigateToCooking}
            activeOpacity={0.8}
          >
            <MochiCharacter mood="happy" size={72} />
            <Text className="mt-2 text-center text-sm font-semibold text-orange-700">
              Cuéntame qué quieres cocinar hoy
            </Text>
          </TouchableOpacity>
        )}
      </AnimatedDashboardCard>

      <View className="mb-12" />
    </ScrollView>
  )
}

export default HomeDashboard