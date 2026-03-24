export * from '@mochi/supabase/types'

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
}

export interface Profile {
  id: string
  full_name: string | null
  wake_up_time: string | null
  total_points: number
}

export interface UserSettings {
  id: string
  user_id: string
  partner_features_enabled: boolean
  study_enabled: boolean
  exercise_enabled: boolean
  habits_enabled: boolean
  goals_enabled: boolean
  mood_enabled: boolean
  gratitude_enabled: boolean
  vouchers_enabled: boolean
  cooking_enabled: boolean
  created_at: string
  updated_at: string
}
