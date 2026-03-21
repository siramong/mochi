import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '@/src/shared/lib/supabase'
import { useSession } from '@/src/core/providers/SessionContext'
import { useScreenTheme } from '@/src/shared/hooks/useScreenTheme'
import { BottomNav, MobileScreen } from '@/src/features/home/components/BottomNav'
import { ExerciseRoutine } from '@/src/features/exercise/components/ExerciseRoutine'
import { HomeDashboard } from '@/src/features/home/components/HomeDashboard'
import { StudySchedule } from '@/src/features/study/components/StudySchedule'
import { MochiCharacter } from '@/src/shared/components/MochiCharacter'
import { HabitsScreen } from '@/app/habits'
import { CookingScreen } from '@/app/cooking'

const screenThemes: Record<
  MobileScreen,
  { statusBarStyle: 'light' | 'dark'; navigationBarStyle: 'light' | 'dark' }
> = {
  home:     { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  study:    { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  exercise: { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  habits:   { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  cooking:  { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
}

// Valida que un string sea una MobileScreen conocida
function isMobileScreen(value: string): value is MobileScreen {
  return ['home', 'study', 'exercise', 'habits', 'cooking'].includes(value)
}

export function HomeScreen() {
  const { session } = useSession()
  const params = useLocalSearchParams<{ tab?: string }>()
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home')
  const [userName, setUserName] = useState('Student')
  const [loadingName, setLoadingName] = useState(true)
  const loadingScale = useSharedValue(1)

  // Cuando llega un param `tab` (p.ej. desde una notificación de Cocina),
  // navegamos a esa tab si es válida.
  useEffect(() => {
    if (params.tab && isMobileScreen(params.tab)) {
      setCurrentScreen(params.tab)
    }
  }, [params.tab])

  useScreenTheme(screenThemes[currentScreen])

  useEffect(() => {
    if (loadingName) {
      loadingScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 650, easing: Easing.inOut(Easing.quad) }),
          withTiming(1,    { duration: 650, easing: Easing.inOut(Easing.quad) })
        ),
        -1, false
      )
      return
    }
    loadingScale.value = withTiming(1, { duration: 180 })
  }, [loadingName, loadingScale])

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingScale.value }],
  }))

  useEffect(() => {
    let mounted = true
    async function loadName() {
      if (!session?.user.id) {
        if (mounted) { setUserName('Student'); setLoadingName(false) }
        return
      }
      setLoadingName(true)
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()
      if (!mounted) return
      setUserName(data?.full_name?.trim() || 'Student')
      setLoadingName(false)
    }
    void loadName()
    return () => { mounted = false }
  }, [session?.user.id])

  const renderContent = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeDashboard
            userName={userName}
            onNavigateToCooking={() => setCurrentScreen('cooking')}
          />
        )
      case 'study':    return <StudySchedule />
      case 'exercise': return <ExerciseRoutine />
      case 'habits':   return <HabitsScreen />
      case 'cooking':  return <CookingScreen />
      default:         return null
    }
  }

  if (loadingName) {
    return (
      <View className="flex-1 items-center justify-center bg-purple-100">
        <Animated.View style={loadingAnimatedStyle}>
          <MochiCharacter mood="thinking" size={96} />
        </Animated.View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-purple-100">
      <View key={currentScreen} className="flex-1">
        {renderContent()}
      </View>
      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </SafeAreaView>
  )
}

export default HomeScreen