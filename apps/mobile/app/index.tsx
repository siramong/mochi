import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
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

const screenBackgroundClass: Record<MobileScreen, string> = {
  home: 'bg-purple-100',
  study: 'bg-purple-100',
  exercise: 'bg-teal-100',
  habits: 'bg-purple-50',
  cooking: 'bg-orange-50',
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
  const tabParam = useMemo(() => {
    if (typeof params.tab === 'string') return params.tab
    if (Array.isArray(params.tab) && typeof params.tab[0] === 'string') return params.tab[0]
    return undefined
  }, [params.tab])

  useEffect(() => {
    if (tabParam && isMobileScreen(tabParam)) {
      setCurrentScreen(tabParam)
      return
    }

    setCurrentScreen('home')
  }, [tabParam])

  const navigateToScreen = useCallback((screen: MobileScreen) => {
    // Actualización optimista: el color activo del bottom nav cambia al instante.
    setCurrentScreen(screen)

    if (screen === 'home') {
      router.replace('/')
      return
    }

    router.replace({ pathname: '/', params: { tab: screen } })
  }, [])

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
            onNavigateToCooking={() => navigateToScreen('cooking')}
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
    <SafeAreaView className={`flex-1 ${screenBackgroundClass[currentScreen]}`}>
      <View key={currentScreen} className="flex-1">
        {renderContent()}
      </View>
      <BottomNav currentScreen={currentScreen} onNavigate={navigateToScreen} />
    </SafeAreaView>
  )
}

export default HomeScreen