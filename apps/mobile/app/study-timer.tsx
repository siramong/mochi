import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { useAchievement } from '@/context/AchievementContext'
import { MochiCharacter } from '@/components/MochiCharacter'
import { addPoints, checkStudyAchievements, updateStreak, checkStreakAchievements } from '@/lib/gamification'
import type { StudyBlock } from '@/types/database'

function parseTimeToSeconds(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours * 60 + minutes) * 60
}

function calcDurationSeconds(startTime: string, endTime: string): number {
  return parseTimeToSeconds(endTime) - parseTimeToSeconds(startTime)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const colorMap: Record<string, string> = {
  pink: 'bg-pink-100',
  blue: 'bg-blue-100',
  yellow: 'bg-yellow-100',
  teal: 'bg-teal-100',
  purple: 'bg-purple-100',
  green: 'bg-green-100',
}

const colorBorderMap: Record<string, string> = {
  pink: 'border-pink-300',
  blue: 'border-blue-300',
  yellow: 'border-yellow-300',
  teal: 'border-teal-300',
  purple: 'border-purple-300',
  green: 'border-green-300',
}

export function StudyTimerScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>()
  const { session } = useSession()
  const { showAchievement } = useAchievement()
  const [block, setBlock] = useState<StudyBlock | null>(null)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progress = useSharedValue(1)

  useEffect(() => {
    async function loadBlock() {
      if (!blockId) {
        setError('No se encontró el bloque')
        setLoading(false)
        return
      }
      try {
        const { data, error: sbError } = await supabase
          .from('study_blocks')
          .select('*')
          .eq('id', blockId)
          .single()
        if (sbError) throw sbError
        const duration = calcDurationSeconds(data.start_time, data.end_time)
        const safeDuration = duration > 0 ? duration : 5400
        setBlock(data)
        setTotalSeconds(safeDuration)
        setTimeLeft(safeDuration)
        progress.value = 1
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando bloque')
      } finally {
        setLoading(false)
      }
    }
    void loadBlock()
  }, [blockId, progress])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          void handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  useEffect(() => {
    if (totalSeconds > 0) {
      progress.value = withTiming(timeLeft / totalSeconds, {
        duration: 900,
        easing: Easing.linear,
      })
    }
  }, [timeLeft, totalSeconds, progress])

  async function handleComplete() {
    if (isCompleting || completed) return
    setIsCompleting(true)
    setIsRunning(false)
    if (!session?.user.id || !block) {
      setIsCompleting(false)
      return
    }
    try {
      const { error: insertError } = await supabase.from('study_sessions').insert({
        user_id: session.user.id,
        study_block_id: block.id,
        subject: block.subject,
        duration_seconds: totalSeconds,
        completed_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      await addPoints(session.user.id, 5)
      await updateStreak(session.user.id)
      await checkStudyAchievements(session.user.id, showAchievement)
      await checkStreakAchievements(session.user.id, showAchievement)
      setCompleted(true)
    } catch (err) {
      console.error('Error completing study session:', err)
    } finally {
      setIsCompleting(false)
    }
  }

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }))

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-purple-50">
        <MochiCharacter mood="thinking" size={96} />
        <Text className="mt-4 text-sm font-semibold text-purple-700">Cargando bloque...</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-purple-50 px-6">
        <MochiCharacter mood="sleepy" size={80} />
        <Text className="mt-4 text-center text-sm font-semibold text-red-600">{error}</Text>
        <TouchableOpacity
          className="mt-6 rounded-2xl bg-purple-500 px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-bold text-white">Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (completed) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-purple-50 px-6">
        <MochiCharacter mood="excited" size={120} />
        <Text className="mt-6 text-2xl font-extrabold text-purple-900">¡Bloque completado!</Text>
        <Text className="mt-2 text-sm font-semibold text-purple-600">
          Terminaste tu sesión de {block?.subject}
        </Text>
        <View className="mt-4 rounded-full bg-yellow-200 px-5 py-2">
          <Text className="font-extrabold text-yellow-900">+5 puntos</Text>
        </View>
        <TouchableOpacity
          className="mt-8 rounded-2xl bg-purple-500 px-8 py-4"
          onPress={() => router.back()}
        >
          <Text className="font-extrabold text-white">Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const blockColor = block?.color ?? 'purple'

  return (
    <SafeAreaView className="flex-1 bg-purple-50 px-6">
      <TouchableOpacity className="mt-2 flex-row items-center" onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color="#7c3aed" />
        <Text className="ml-1 font-bold text-purple-700">Volver</Text>
      </TouchableOpacity>

      <View className="mt-6 items-center">
        <Text className="text-2xl font-extrabold text-purple-900">{block?.subject}</Text>
        <Text className="mt-1 text-sm font-semibold text-purple-500">
          {block?.start_time} - {block?.end_time}
        </Text>
      </View>

      <View className="mt-10 items-center">
        <View
          className={`h-52 w-52 items-center justify-center rounded-full border-8 ${colorBorderMap[blockColor] ?? 'border-purple-300'} ${colorMap[blockColor] ?? 'bg-purple-100'}`}
        >
          <Text className="text-5xl font-extrabold text-purple-900">{formatTime(timeLeft)}</Text>
          <Text className="mt-1 text-sm font-semibold text-purple-500">restante</Text>
        </View>
      </View>

      <View className="mt-8">
        <View className="h-3 w-full overflow-hidden rounded-full bg-purple-100">
          <Animated.View style={progressStyle} className="h-3 rounded-full bg-purple-500" />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs font-semibold text-purple-400">0:00</Text>
          <Text className="text-xs font-semibold text-purple-400">{formatTime(totalSeconds)}</Text>
        </View>
      </View>

      <View className="mt-10 items-center">
        <TouchableOpacity
          className="h-16 w-16 items-center justify-center rounded-full bg-purple-500"
          onPress={() => setIsRunning((r) => !r)}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={28} color="white" />
        </TouchableOpacity>
        <Text className="mt-3 text-sm font-semibold text-purple-500">
          {isRunning ? 'Pausar' : 'Iniciar'}
        </Text>
      </View>

      <TouchableOpacity
        className={`mt-8 items-center rounded-2xl border-2 border-purple-200 py-3 ${isCompleting ? 'bg-purple-100' : 'bg-white'}`}
        onPress={() => void handleComplete()}
        disabled={isCompleting}
      >
        <Text className="font-bold text-purple-700">
          {isCompleting ? 'Guardando...' : 'Marcar como completado'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default StudyTimerScreen
