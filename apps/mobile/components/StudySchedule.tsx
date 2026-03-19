import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useSharedValue, useAnimatedStyle, withDelay, withTiming, FadeIn, SlideInUp } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { StudyBlock } from '@/types/database'

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

export function StudySchedule() {
  const { session } = useSession()
  const [selectedDay, setSelectedDay] = useState('X')
  const [blocks, setBlocks] = useState<StudyBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {/* Day selector */}
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

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="mt-4 text-sm font-semibold text-purple-700">Cargando...</Text>
          </View>
        ) : error ? (
          <View className="rounded-3xl border-2 border-red-200 bg-red-50 p-4">
            <Text className="text-sm font-semibold text-red-700">{error}</Text>
          </View>
        ) : blocks.length === 0 ? (
          <View className="rounded-3xl border-2 border-purple-200 bg-white p-6">
            <View className="items-center">
              <Ionicons name="calendar-outline" size={48} color="#c084fc" />
              <Text className="mt-3 text-center text-sm font-semibold text-purple-600">
                No hay bloques de estudio para este día
              </Text>
            </View>
          </View>
        ) : (
          <View className="rounded-3xl border-2 border-purple-200 bg-white p-4">
            {blocks.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.delay(index * 100)}
                className={`mb-3 rounded-2xl border border-slate-100 p-4 ${colorMap[item.color] || 'bg-purple-200'}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-extrabold text-slate-800">{item.subject}</Text>
                  <Text className="text-xs font-bold text-slate-600">
                    {(() => {
                      const start = parseInt(item.start_time.split(':')[0])
                      const end = parseInt(item.end_time.split(':')[0])
                      const duration = end - start
                      return `${duration}h`
                    })()}
                  </Text>
                </View>
                <Text className="mt-1 text-sm font-semibold text-slate-700">
                  {item.start_time} - {item.end_time}
                </Text>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity className="absolute bottom-28 right-6 h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-purple-500">
        <Ionicons name="add" size={26} color="white" />
      </TouchableOpacity>
    </View>
  )
}

export default StudySchedule