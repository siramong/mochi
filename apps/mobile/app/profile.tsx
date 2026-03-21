import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
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
import { MochiCharacter } from '@/components/MochiCharacter'
import type { Achievement, UserAchievement, Streak } from '@/types/database'

interface Profile {
  full_name: string
  total_points: number
  wake_up_time: string | null
}

type QuickAccessItem = {
  label: string
  route: '/goals' | '/vouchers' | '/mood' | '/gratitude' | '/settings' | '/study-history' | '/cooking'
  icon: keyof typeof Ionicons.glyphMap
  cardClass: string
  iconColor: string
  textClass: string
}

const quickAccessItems: QuickAccessItem[] = [
  {
    label: 'Mis metas',
    route: '/goals',
    icon: 'flag-outline',
    cardClass: 'border-pink-200 bg-pink-100',
    iconColor: '#be185d',
    textClass: 'text-pink-900',
  },
  {
    label: 'Mis vales',
    route: '/vouchers',
    icon: 'ticket-outline',
    cardClass: 'border-yellow-200 bg-yellow-100',
    iconColor: '#92400e',
    textClass: 'text-yellow-900',
  },
  {
    label: 'Historial de estudio',
    route: '/study-history',
    icon: 'time-outline',
    cardClass: 'border-indigo-200 bg-indigo-100',
    iconColor: '#3730a3',
    textClass: 'text-indigo-900',
  },
  {
    label: 'Estado de ánimo',
    route: '/mood',
    icon: 'heart-outline',
    cardClass: 'border-orange-200 bg-orange-100',
    iconColor: '#c2410c',
    textClass: 'text-orange-900',
  },
  {
    label: 'Gratitud',
    route: '/gratitude',
    icon: 'flower-outline',
    cardClass: 'border-emerald-200 bg-emerald-100',
    iconColor: '#047857',
    textClass: 'text-emerald-900',
  },
  {
    label: 'Cocina',
    route: '/cooking',
    icon: 'restaurant-outline',
    cardClass: 'border-orange-200 bg-orange-100',
    iconColor: '#c2410c',
    textClass: 'text-orange-900',
  },
  {
    label: 'Ajustes',
    route: '/settings',
    icon: 'settings-outline',
    cardClass: 'border-blue-200 bg-blue-100',
    iconColor: '#1d4ed8',
    textClass: 'text-blue-900',
  },
]

export function ProfileScreen() {
  const { session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadingScale = useSharedValue(1)

  useEffect(() => {
    if (loading) {
      loadingScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 650, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    } else {
      loadingScale.value = withTiming(1, { duration: 180 })
    }
  }, [loading, loadingScale])

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: loadingScale.value }],
  }))

  const loadProfile = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setProfile(null)
      setStreak(null)
      setUserAchievements([])
      setAllAchievements([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [profileRes, streakRes, userAchRes, allAchRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, total_points, wake_up_time')
          .eq('id', userId)
          .single(),
        supabase.from('streaks').select('*').eq('user_id', userId).single(),
        supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', userId),
        supabase.from('achievements').select('*'),
      ])

      if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error
      if (streakRes.error && streakRes.error.code !== 'PGRST116') throw streakRes.error
      if (userAchRes.error) throw userAchRes.error
      if (allAchRes.error) throw allAchRes.error

      setProfile(profileRes.data ?? null)
      setStreak(streakRes.data ?? null)
      setUserAchievements(userAchRes.data ?? [])
      setAllAchievements(allAchRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando perfil')
      setProfile(null)
      setStreak(null)
      setUserAchievements([])
      setAllAchievements([])
    } finally {
      setLoading(false)
    }
  }, [session?.user.id])

  useFocusEffect(
    useCallback(() => {
      void loadProfile()
    }, [loadProfile])
  )

  const unlockedIds = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievement_id)),
    [userAchievements]
  )

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-purple-50">
        <Animated.View style={loadingAnimatedStyle}>
          <MochiCharacter mood="thinking" size={96} />
        </Animated.View>
        <Text className="mt-4 text-sm font-semibold text-purple-700">Cargando perfil...</Text>
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
          onPress={() => void loadProfile()}
        >
          <Text className="font-bold text-white">Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-purple-50">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <TouchableOpacity className="mt-4 flex-row items-center" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#7c3aed" />
          <Text className="ml-1 font-bold text-purple-700">Volver</Text>
        </TouchableOpacity>

        <View className="mt-6 items-center">
          <MochiCharacter mood="happy" size={80} />
          <Text className="mt-4 text-2xl font-extrabold text-purple-900">
            {profile?.full_name ?? session?.user.email ?? 'Mochi Student'}
          </Text>

          <View className="mt-3 flex-row items-center">
            <View className="mr-3 flex-row items-center rounded-full bg-yellow-200 px-4 py-2">
              {loading ? (
                <ActivityIndicator size="small" color="#92400e" />
              ) : (
                <Ionicons name="star" size={14} color="#92400e" />
              )}
              <Text className="ml-1 font-extrabold text-yellow-900">
                {profile?.total_points ?? 0} puntos
              </Text>
            </View>
            <View className="flex-row items-center rounded-full bg-orange-100 px-4 py-2">
              <Ionicons name="flame" size={14} color="#ea580c" />
              <Text className="ml-1 font-extrabold text-orange-800">
                {streak?.current_streak ?? 0} días
              </Text>
            </View>
          </View>

          {streak && streak.longest_streak > 0 && (
            <Text className="mt-2 text-xs font-semibold text-purple-500">
              Racha más larga: {streak.longest_streak} días
            </Text>
          )}
        </View>

        <View className="mt-8 rounded-3xl border-2 border-purple-200 bg-white p-4">
          <Text className="text-lg font-extrabold text-purple-900">Accesos rápidos</Text>
          <View className="mt-4 flex-row flex-wrap">
            {quickAccessItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                className="mb-3 w-1/2 pr-3"
                onPress={() => router.push(item.route)}
              >
                <View className={`rounded-2xl border-2 px-3 py-4 ${item.cardClass}`}>
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text className={`mt-2 text-sm font-extrabold ${item.textClass}`}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-8">
          <Text className="mb-4 text-lg font-extrabold text-purple-900">Logros</Text>

          {allAchievements.length === 0 ? (
            <View className="items-center rounded-3xl border-2 border-purple-200 bg-white p-6">
              <MochiCharacter mood="happy" size={64} />
              <Text className="mt-3 text-center text-sm font-semibold text-purple-600">
                Completa actividades para desbloquear logros
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {allAchievements.map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id)
                return (
                  <View key={achievement.id} className="mb-3 w-1/2 pr-3">
                    <View
                      className={`rounded-2xl border-2 p-3 ${
                        isUnlocked
                          ? 'border-purple-200 bg-purple-100'
                          : 'border-gray-200 bg-gray-100 opacity-60'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                          <Ionicons
                            name={
                              isUnlocked
                                ? (achievement.icon as keyof typeof Ionicons.glyphMap) ?? 'trophy'
                                : 'lock-closed'
                            }
                            size={18}
                            color={isUnlocked ? '#7c3aed' : '#9ca3af'}
                          />
                        </View>
                        {isUnlocked && (
                          <View className="rounded-full bg-purple-200 px-2 py-0.5">
                            <Text className="text-xs font-bold text-purple-800">
                              +{achievement.points}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className={`mt-2 text-xs font-bold ${isUnlocked ? 'text-purple-900' : 'text-gray-500'}`}
                        numberOfLines={2}
                      >
                        {achievement.title}
                      </Text>
                      {isUnlocked && (
                        <Text className="mt-1 text-xs text-purple-500" numberOfLines={2}>
                          {achievement.description}
                        </Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen