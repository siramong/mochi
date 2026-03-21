import { supabase } from '@/lib/supabase'

export async function addPoints(userId: string, points: number): Promise<void> {
  await supabase.rpc('increment_points', { user_id: userId, points })
}

export async function unlockAchievement(userId: string, achievementKey: string): Promise<void> {
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id')
    .eq('key', achievementKey)
    .single()
  if (!achievement) return
  await supabase
    .from('user_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievement.id },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
}

export async function checkStudyAchievements(userId: string): Promise<void> {
  const { count } = await supabase
    .from('study_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const sessionCount = count ?? 0
  if (sessionCount >= 1) await unlockAchievement(userId, 'first_study')
  if (sessionCount >= 10) await unlockAchievement(userId, 'study_10')
}

export async function checkExerciseAchievements(userId: string): Promise<void> {
  const { count: totalCount } = await supabase
    .from('routine_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((totalCount ?? 0) >= 1) await unlockAchievement(userId, 'first_routine')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { count: weekCount } = await supabase
    .from('routine_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', sevenDaysAgo.toISOString())
  if ((weekCount ?? 0) >= 7) await unlockAchievement(userId, 'routine_7')
}

export async function checkStreakAchievements(userId: string): Promise<void> {
  const { data } = await supabase
    .from('streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single()
  const streak = data?.current_streak ?? 0
  if (streak >= 3) await unlockAchievement(userId, 'streak_3')
  if (streak >= 7) await unlockAchievement(userId, 'streak_7')
  if (streak >= 30) await unlockAchievement(userId, 'streak_30')
  if (streak >= 365) await unlockAchievement(userId, 'streak_365')
}

// ─── Logros de Cocina ─────────────────────────────────────────────────────────

/**
 * Llama esto cuando la usuaria guarda su primera receta generada con IA.
 */
export async function checkCookingRecipeAchievements(userId: string): Promise<void> {
  const { count } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const total = count ?? 0
  if (total >= 1) await unlockAchievement(userId, 'first_recipe')
  if (total >= 5) await unlockAchievement(userId, 'recipes_5')
  if (total >= 10) await unlockAchievement(userId, 'recipes_10')
}

/**
 * Llama esto cuando la usuaria completa una sesión de cocina (recipe-player).
 */
export async function checkCookingSessionAchievements(userId: string): Promise<void> {
  // Primera vez cocinando
  const { count: totalSessions } = await supabase
    .from('recipe_cook_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_finished', true)

  if ((totalSessions ?? 0) >= 1) await unlockAchievement(userId, 'first_cook')

  // 3 recetas distintas completadas
  const { data: distinctRecipes } = await supabase
    .from('recipe_cook_sessions')
    .select('recipe_id')
    .eq('user_id', userId)
    .eq('is_finished', true)

  const uniqueRecipes = new Set((distinctRecipes ?? []).map((s) => s.recipe_id))
  if (uniqueRecipes.size >= 3) await unlockAchievement(userId, 'cook_streak_3')
}

/**
 * Llama esto cuando la usuaria guarda una calificación de 5 estrellas.
 */
export async function checkPerfectRecipeAchievement(userId: string): Promise<void> {
  const { count } = await supabase
    .from('recipe_cook_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('rating', 5)

  if ((count ?? 0) >= 1) await unlockAchievement(userId, 'perfect_recipe')
}

/**
 * Llama esto cuando la usuaria marca una receta como favorita.
 */
export async function checkFavoriteRecipeAchievement(userId: string): Promise<void> {
  const { count } = await supabase
    .from('recipes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_favorite', true)

  if ((count ?? 0) >= 1) await unlockAchievement(userId, 'favorite_recipe')
}

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