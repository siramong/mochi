import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { getDailyMotivation } from '@/lib/ai'
import { MochiCharacter } from '@/components/MochiCharacter'

type DailyMotivationProps = {
  userName: string
  studyBlockCount: number
  hasRoutine: boolean
  timeOfDay: string
}

export function DailyMotivation({ userName, studyBlockCount, hasRoutine, timeOfDay }: DailyMotivationProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const shimmerOpacity = useSharedValue(1)

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    )
  }, [shimmerOpacity])

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }))

  useEffect(() => {
    let mounted = true
    async function load() {
      const msg = await getDailyMotivation(userName, studyBlockCount, hasRoutine, timeOfDay)
      if (mounted) {
        setMessage(msg)
        setLoading(false)
        shimmerOpacity.value = withTiming(1, { duration: 200 })
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [userName, studyBlockCount, hasRoutine, timeOfDay, shimmerOpacity])

  return (
    <View className="rounded-3xl border-2 border-yellow-200 bg-yellow-50 p-4 flex-row items-center">
      <MochiCharacter mood="happy" size={56} />
      <View className="flex-1 ml-3">
        {loading ? (
          <Animated.View style={shimmerStyle}>
            <View className="h-3 w-full rounded-full bg-yellow-200 mb-2" />
            <View className="h-3 w-3/4 rounded-full bg-yellow-200" />
          </Animated.View>
        ) : (
          <Text className="text-sm font-semibold text-yellow-900 leading-5">{message}</Text>
        )}
      </View>
    </View>
  )
}

export default DailyMotivation
