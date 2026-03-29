import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Profile, Streak, UserAchievement } from '@/types/database'

type ProfileState = {
  profile: Profile | null
  streak: Streak | null
  achievements: UserAchievement[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProfile(): ProfileState {
  const { session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streak, setStreak] = useState<Streak | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const userId = session?.user.id

    if (!userId) {
      setProfile(null)
      setStreak(null)
      setAchievements([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [profileRes, streakRes, achievementsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>(),
        supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle<Streak>(),
        supabase
          .from('user_achievements')
          .select('*, achievement:achievements(*)')
          .eq('user_id', userId)
          .returns<UserAchievement[]>(),
      ])

      if (profileRes.error) {
        setError(profileRes.error.message)
      } else {
        setProfile(profileRes.data ?? null)
      }

      if (!streakRes.error) {
        setStreak(streakRes.data ?? null)
      }

      if (!achievementsRes.error) {
        setAchievements(achievementsRes.data ?? [])
      }
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'No se pudo cargar el perfil')
      setProfile(null)
      setStreak(null)
      setAchievements([])
    } finally {
      setLoading(false)
    }
  }, [session?.user.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { profile, streak, achievements, loading, error, refresh }
}
