import { useEffect, useState } from 'react'
import { ActivityIndicator, SafeAreaView, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { BottomNav, MobileScreen } from '@/components/BottomNav'
import { ExerciseRoutine } from '@/components/ExerciseRoutine'
import { HomeDashboard } from '@/components/HomeDashboard'
import { StudySchedule } from '@/components/StudySchedule'

export function HomeScreen() {
  const { session } = useSession()
  const [currentScreen, setCurrentScreen] = useState<MobileScreen>('home')
  const [userName, setUserName] = useState('Student')
  const [loadingName, setLoadingName] = useState(true)

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

  const content = {
    home: (
      <HomeDashboard
        userName={userName}
        email={session?.user.email}
        onSignOut={() => {
          void supabase.auth.signOut()
        }}
      />
    ),
    study: <StudySchedule />,
    exercise: <ExerciseRoutine />,
  }[currentScreen]

  if (loadingName) {
    return (
      <View className="flex-1 items-center justify-center bg-purple-100">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-purple-100">
      <View className="flex-1">
        {content}
      </View>

      <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
    </SafeAreaView>
  )
}

export default HomeScreen