import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

export type MobileScreen = 'home' | 'study' | 'exercise' | 'habits'

type BottomNavProps = {
  currentScreen: MobileScreen
  onNavigate: (screen: MobileScreen) => void
}

const tabs: Array<{ id: MobileScreen; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'study', label: 'Estudio', icon: 'book' },
  { id: 'exercise', label: 'Ejercicio', icon: 'barbell' },
  { id: 'habits', label: 'Hábitos', icon: 'leaf' },
]

type BottomTabItemProps = {
  id: MobileScreen
  label: string
  icon: keyof typeof Ionicons.glyphMap
  active: boolean
  onNavigate: (screen: MobileScreen) => void
}

function BottomTabItem({ id, label, icon, active, onNavigate }: BottomTabItemProps) {
  const iconScale = useSharedValue(1)
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    if (active) {
      iconScale.value = withSequence(
        withTiming(1.15, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) })
      )
    }
  }, [active, iconScale])

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    }
  })

  return (
    <TouchableOpacity
      className={`h-14 w-20 items-center justify-center rounded-2xl ${active ? 'bg-purple-100' : ''}`}
      onPress={() => {
        onNavigate(id)
      }}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons name={icon} size={20} color={active ? '#a855f7' : '#d8b4fe'} />
      </Animated.View>
      <Text className={`mt-1 text-xs font-bold ${active ? 'text-purple-700' : 'text-purple-400'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <View className="border-t border-purple-100 bg-white px-5 pb-6 pt-3">
      <View className="flex-row items-center justify-between">
        {tabs.map((tab) => {
          const active = currentScreen === tab.id

          return (
            <BottomTabItem
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={active}
              onNavigate={onNavigate}
            />
          )
        })}
      </View>
    </View>
  )
}

export default BottomNav