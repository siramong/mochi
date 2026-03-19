import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import type { StudyBlock } from '@/types/database'
import { MochiCharacter } from '@/components/MochiCharacter'

const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const dayOfWeekMap: Record<string, number> = {
  L: 0,
  M: 1,
  X: 2,
  J: 3,
  V: 4,
  S: 5,
  D: 6,
}

const colorMap: Record<string, string> = {
  pink: 'bg-pink-200',
  blue: 'bg-blue-200',
  yellow: 'bg-yellow-200',
  teal: 'bg-teal-200',
  purple: 'bg-purple-200',
  green: 'bg-green-200',
}

type AnimatedStudyCardProps = {
  block: StudyBlock
  index: number
  animationSeed: number
}

function AnimatedStudyCard({ block, index, animationSeed }: AnimatedStudyCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)

  useEffect(() => {
    opacity.value = 0
    translateY.value = 16

    opacity.value = withDelay(index * 100, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }))
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }))
  }, [animationSeed, index, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }
  })

  return (
    <Animated.View
      style={animatedStyle}
      className={`mb-3 rounded-2xl border border-slate-100 p-4 ${colorMap[block.color] || 'bg-purple-200'}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-extrabold text-slate-800">{block.subject}</Text>
        <Text className="text-xs font-bold text-slate-600">
          {(() => {
            const start = parseInt(block.start_time.split(':')[0])
            const end = parseInt(block.end_time.split(':')[0])
            const duration = end - start
            return `${duration}h`
          })()}
        </Text>
      </View>
      <Text className="mt-1 text-sm font-semibold text-slate-700">
        {block.start_time} - {block.end_time}
      </Text>
    </Animated.View>
  )
}

export function StudySchedule() {
  const { session } = useSession()
  const [selectedDay, setSelectedDay] = useState('X')
  const [blocks, setBlocks] = useState<StudyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animationSeed, setAnimationSeed] = useState(0)

  const loadingScale = useSharedValue(1)
  const fabScale = useSharedValue(1)

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

  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }],
    }
  })

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    async function loadBlocks() {
      try {
        setLoading(true)
        setError(null)

        const dayNum = dayOfWeekMap[selectedDay] ?? 2

        const { data, error: supabaseError } = await supabase
          .from('study_blocks')
          .select('*')
          .eq('user_id', userId)
          .eq('day_of_week', dayNum)
          .order('start_time', { ascending: true })

        if (supabaseError) throw supabaseError
        setBlocks(data ?? [])
        setAnimationSeed((prev) => prev + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando bloques')
        setBlocks([])
      } finally {
        setLoading(false)
      }
    }

    loadBlocks()
  }, [session?.user.id, selectedDay])

  return (
    <View className="flex-1 bg-purple-100 px-5 pt-12">
      <View className="mb-6 flex-row items-center">
        <Ionicons name="calendar" size={20} color="#6b21a8" />
        <Text className="ml-2 text-2xl font-extrabold text-purple-900">Horario de estudio</Text>
      </View>

      <View className="mb-4 flex-row justify-between rounded-3xl border-2 border-purple-200 bg-white p-2">
        {days.map((day) => {
          const active = day === selectedDay

          return (
            <TouchableOpacity
              key={day}
              className={`h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-purple-500' : ''}`}
              onPress={() => {
                setSelectedDay(day)
              }}
            >
              <Text className={`font-extrabold ${active ? 'text-white' : 'text-purple-500'}`}>
                {day}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-8">
            <Animated.View style={loadingAnimatedStyle}>
              <MochiCharacter mood="thinking" size={92} />
            </Animated.View>
            <Text className="mt-4 text-sm font-semibold text-purple-700">Cargando bloques...</Text>
          </View>
        ) : error ? (
          <View className="rounded-3xl border-2 border-red-200 bg-red-50 p-4">
            <Text className="text-sm font-semibold text-red-700">{error}</Text>
          </View>
        ) : blocks.length === 0 ? (
          <View className="rounded-3xl border-2 border-purple-200 bg-white p-6">
            <View className="items-center">
              <MochiCharacter mood="sleepy" size={88} />
              <Text className="mt-3 text-center text-sm font-semibold text-purple-600">
                No hay bloques para este día
              </Text>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl border-2 border-purple-200 bg-white p-4">
            {blocks.map((item, index) => (
              <AnimatedStudyCard
                key={item.id}
                block={item}
                index={index}
                animationSeed={animationSeed}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Animated.View style={fabAnimatedStyle} className="absolute bottom-28 right-6">
        <TouchableOpacity
          className="h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-purple-500"
          onPressIn={() => {
            fabScale.value = withSequence(
              withSpring(1.12, { damping: 8, stiffness: 180 }),
              withSpring(1, { damping: 10, stiffness: 180 })
            )
          }}
          onPress={() => router.push('/study-create')}
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export default StudySchedule
