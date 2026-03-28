import { supabase } from './supabase'
import { UserAchievement } from '@mochi/supabase/types'

/**
 * Añade puntos al usuario
 */
export async function addPoints(userId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc('increment_points', {
    user_id: userId,
    points,
  })

  if (!error && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mochi:points-updated'))
  }

  if (error) console.error('Error adding points:', error)
}

/**
 * Desbloquea un achievement específico si no está ya desbloqueado
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: string
): Promise<UserAchievement | null> {
  // Obtener achievement por key
  const { data: achievement, error: fetchError } = await supabase
    .from('achievements')
    .select('*')
    .eq('key', achievementKey)
    .single()

  if (fetchError || !achievement) {
    console.error('Achievement not found:', achievementKey)
    return null
  }

  // Intentar insertar en user_achievements (con ignorar duplicados)
  const { data, error } = await supabase
    .from('user_achievements')
    .upsert(
      {
        user_id: userId,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
    .select()

  if (error) {
    console.error('Error unlocking achievement:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0] as UserAchievement
}

/**
 * Verifica si el usuario debe desbloquear achievements por haber completado sesiones
 */
export async function checkStudyAchievements(userId: string): Promise<UserAchievement[]> {
  const unlockedAchievements: UserAchievement[] = []

  // Contar sesiones de estudio completadas
  const { data: sessions, error: countError } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('user_id', userId)

  if (countError) {
    console.error('Error fetching study sessions:', countError)
    return []
  }

  const sessionCount = sessions?.length || 0

  // Desbloquear 'first_study' si tiene ≥1 sesión
  if (sessionCount >= 1) {
    const achievement = await unlockAchievement(userId, 'first_study')
    if (achievement) unlockedAchievements.push(achievement)
  }

  // Desbloquear 'study_10' si tiene ≥10 sesiones
  if (sessionCount >= 10) {
    const achievement = await unlockAchievement(userId, 'study_10')
    if (achievement) unlockedAchievements.push(achievement)
  }

  return unlockedAchievements
}

export async function checkAndUnlockStudyAchievements(userId: string): Promise<UserAchievement[]> {
  return checkStudyAchievements(userId)
}
