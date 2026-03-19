import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'

export type MobileScreen = 'home' | 'study' | 'exercise'

type BottomNavProps = {
  currentScreen: MobileScreen
  onNavigate: (screen: MobileScreen) => void
}

const tabs: Array<{ id: MobileScreen; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'study', label: 'Estudio', icon: 'book' },
  { id: 'exercise', label: 'Ejercicio', icon: 'barbell' },
]

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  return (
    <View className="border-t border-purple-100 bg-white px-5 pb-6 pt-3">
      <View className="flex-row items-center justify-between">
        {tabs.map((tab) => {
          const active = currentScreen === tab.id

          return (
            <TouchableOpacity
              key={tab.id}
              className={`h-14 w-20 items-center justify-center rounded-2xl ${active ? 'bg-purple-100' : ''}`}
              onPress={() => {
                onNavigate(tab.id)
              }}
            >
              <Ionicons name={tab.icon} size={20} color={active ? '#a855f7' : '#d8b4fe'} />
              <Text className={`mt-1 text-xs font-bold ${active ? 'text-purple-700' : 'text-purple-400'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default BottomNav