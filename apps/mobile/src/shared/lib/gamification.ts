import { supabase } from '@/src/shared/lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UnlockedAchievement = {
  title: string
  description: string
  points: number
  icon?: string
}

type OnUnlock = (achievement: UnlockedAchievement) => void

// ─── Puntos ───────────────────────────────────────────────────────────────────

export async function addPoints(userId: string, points: number): Promise<void> {
  await supabase.rpc('increment_points', { user_id: userId, points })
}

// ─── Desbloqueo de logros ─────────────────────────────────────────────────────

/**
 * Intenta desbloquear un logro por su key.
 * Retorna los datos del logro si fue NUEVO (primera vez que se desbloquea).
 * Retorna null si ya estaba desbloqueado o si no existe.
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: string
): Promise<UnlockedAchievement | null> {
  // 1. Buscar el logro
  const { data: achievement, error: achError } = await supabase
    .from('achievements')
    .select('id, title, description, points, icon')
    .eq('key', achievementKey)
    .single()

  if (achError || !achievement) return null

  // 2. Intentar insertar — si ya existe, ignoreDuplicates lo descarta
  const { data: inserted, error: insertError } = await supabase
    .from('user_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievement.id },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
    .select('id')

  if (insertError) return null

  // upsert con ignoreDuplicates retorna [] si ya existía, [row] si fue nuevo
  const wasNew = Array.isArray(inserted) && inserted.length > 0
  if (!wasNew) return null

  return {
    title: achievement.title,
    description: achievement.description,
    points: achievement.points,
    icon: achievement.icon ?? undefined,
  }
}

// ─── Helper interno ───────────────────────────────────────────────────────────

/**
 * Desbloquea y notifica si fue nuevo.
 */
async function tryUnlock(
  userId: string,
  key: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const result = await unlockAchievement(userId, key)
  if (result && onUnlock) onUnlock(result)
}

// ─── Checks por categoría ─────────────────────────────────────────────────────

export async function checkStudyAchievements(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count } = await supabase
    .from('study_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const sessionCount = count ?? 0
  if (sessionCount >= 1) await tryUnlock(userId, 'first_study', onUnlock)
  if (sessionCount >= 10) await tryUnlock(userId, 'study_10', onUnlock)
}

export async function checkExerciseAchievements(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count: totalCount } = await supabase
    .from('routine_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((totalCount ?? 0) >= 1) await tryUnlock(userId, 'first_routine', onUnlock)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: weekCount } = await supabase
    .from('routine_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', sevenDaysAgo.toISOString())
  if ((weekCount ?? 0) >= 7) await tryUnlock(userId, 'routine_7', onUnlock)
}

export async function checkStreakAchievements(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { data } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single()
  const streak = data?.current_streak ?? 0
  if (streak >= 3)   await tryUnlock(userId, 'streak_3', onUnlock)
  if (streak >= 7)   await tryUnlock(userId, 'streak_7', onUnlock)
  if (streak >= 30)  await tryUnlock(userId, 'streak_30', onUnlock)
  if (streak >= 365) await tryUnlock(userId, 'streak_365', onUnlock)
}

// ─── Logros de Cocina ─────────────────────────────────────────────────────────

export async function checkCookingRecipeAchievements(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const total = count ?? 0
  if (total >= 1)  await tryUnlock(userId, 'first_recipe', onUnlock)
  if (total >= 5)  await tryUnlock(userId, 'recipes_5', onUnlock)
  if (total >= 10) await tryUnlock(userId, 'recipes_10', onUnlock)
}

export async function checkCookingSessionAchievements(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count: totalSessions } = await supabase
    .from('recipe_cook_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_finished', true)

  if ((totalSessions ?? 0) >= 1) await tryUnlock(userId, 'first_cook', onUnlock)

  const { data: distinctRecipes } = await supabase
    .from('recipe_cook_sessions')
    .select('recipe_id')
    .eq('user_id', userId)
    .eq('is_finished', true)

  const uniqueRecipes = new Set((distinctRecipes ?? []).map((s) => s.recipe_id))
  if (uniqueRecipes.size >= 3) await tryUnlock(userId, 'cook_streak_3', onUnlock)
}

export async function checkPerfectRecipeAchievement(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count } = await supabase
    .from('recipe_cook_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('rating', 5)

  if ((count ?? 0) >= 1) await tryUnlock(userId, 'perfect_recipe', onUnlock)
}

export async function checkFavoriteRecipeAchievement(
  userId: string,
  onUnlock?: OnUnlock
): Promise<void> {
  const { count } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_favorite', true)

  if ((count ?? 0) >= 1) await tryUnlock(userId, 'favorite_recipe', onUnlock)
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return
  }

  if (existing.last_activity_date === today) return

  let newStreak = 1
  if (existing.last_activity_date === yesterdayStr) {
    newStreak = existing.current_streak + 1
  }
  const newLongest = Math.max(newStreak, existing.longest_streak)

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
    })
    .eq('user_id', userId)
}