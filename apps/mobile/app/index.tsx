import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { useScreenTheme } from '@/hooks/useScreenTheme'
import { BottomNav, MobileScreen } from '@/components/BottomNav'
import { ExerciseRoutine } from '@/components/ExerciseRoutine'
import { HomeDashboard } from '@/components/HomeDashboard'
import { StudySchedule } from '@/components/StudySchedule'
import { MochiCharacter } from '@/components/MochiCharacter'
import { HabitsScreen } from '@/app/habits'

const screenThemes: Record<MobileScreen, { statusBarStyle: 'light' | 'dark'; navigationBarStyle: 'light' | 'dark' }> = {
  home:     { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  study:    { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  exercise: { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
  habits:   { statusBarStyle: 'dark', navigationBarStyle: 'dark' },
}

export function HomeScreen() {
  const { session } = useSession()
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home')
  const [userName, setUserName] = useState('Student')
  const [loadingName, setLoadingName] = useState(true)
  const loadingScale = useSharedValue(1)

  useScreenTheme(screenThemes[currentScreen])

  useEffect(() => {
    if (loadingName) {
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
  }, [loadingName, loadingScale])

  const loadingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: loadingScale.value }],
    }
  })

  useEffect(() => {
    let mounted = true

    async function loadName() {
      if (!session?.user.id) {
        if (mounted) {
          setUserName('Student')
          setLoadingName(false)
        }
        return
      }

      setLoadingName(true)

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()

      if (!mounted) return

      const nextName = data?.full_name?.trim() || 'Student'
      setUserName(nextName)
      setLoadingName(false)
    }

    void loadName()

    return () => {
      mounted = false
    }
  }, [session?.user.id])

  const renderContent = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeDashboard userName={userName} />
      case 'study':
        return <StudySchedule />
      case 'exercise':
        return <ExerciseRoutine />
      case 'habits':
        return <HabitsScreen />
      default:
        return null
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