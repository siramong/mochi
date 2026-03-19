import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import type { Habit } from '@/types/database'

type HabitCardProps = {
  habit: Habit
  isCompleted: boolean
  onToggle: () => void
}

const colorBorderMap: Record<string, string> = {
  pink: 'border-pink-200',
  yellow: 'border-yellow-200',
  blue: 'border-blue-200',
  teal: 'border-teal-200',
  purple: 'border-purple-200',
}

const colorBgMap: Record<string, string> = {
  pink: 'bg-pink-100',
  yellow: 'bg-yellow-100',
  blue: 'bg-blue-100',
  teal: 'bg-teal-100',
  purple: 'bg-purple-100',
}

const colorIconBgMap: Record<string, string> = {
  pink: 'bg-pink-200',
  yellow: 'bg-yellow-200',
  blue: 'bg-blue-200',
  teal: 'bg-teal-200',
  purple: 'bg-purple-200',
}

const colorIconMap: Record<string, string> = {
  pink: '#9d174d',
  yellow: '#92400e',
  blue: '#1e3a8a',
  teal: '#134e4a',
  purple: '#4c1d95',
}

export function HabitCard({ habit, isCompleted, onToggle }: HabitCardProps) {
  const scale = useSharedValue(1)
  const isCompletedShared = useDerivedValue(() => isCompleted)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isCompletedShared.value ? 0.6 : 1,
  }))

  function handlePress() {
    scale.value = withSpring(0.94, { damping: 8, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 8, stiffness: 200 })
    })
    onToggle()
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={animatedStyle}
        className={`mb-3 flex-row items-center rounded-2xl border-2 p-4 ${colorBorderMap[habit.color] ?? 'border-purple-200'} ${colorBgMap[habit.color] ?? 'bg-purple-100'}`}
      >
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${colorIconBgMap[habit.color] ?? 'bg-purple-200'}`}
        >
          <Ionicons
            name={habit.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={colorIconMap[habit.color] ?? '#4c1d95'}
          />
        </View>
        <Text className="ml-3 flex-1 text-sm font-bold text-slate-800">{habit.name}</Text>
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${isCompleted ? 'bg-green-400' : 'border-2 border-slate-300 bg-white'}`}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

export default HabitCard
