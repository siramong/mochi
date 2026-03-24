// ─── Profile & Core ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  wake_up_time: string | null
  total_points: number
}

// ─── Study ────────────────────────────────────────────────────────────────

export interface StudyBlock {
  id: string
  user_id: string
  subject: string
  day_of_week: number
  start_time: string
  end_time: string
  color: string
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  study_block_id: string | null
  subject: string
  duration_seconds: number
  completed_at: string
}

export interface ExamLog {
  id: string
  user_id: string
  subject: string
  grade: number
  max_grade: number
  notes: string | null
  exam_date: string
  created_at: string
}

// ─── Exercise & Routines ────────────────────────────────────────────────────

export interface Exercise {
  id: string
  user_id: string
  name: string
  sets: number
  reps: number
  duration_seconds: number
  notes: string | null
  created_at: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  days: number[]
  created_at: string
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_id: string
  order_index: number
  exercise: Exercise
}

export interface RoutineWithExercises extends Routine {
  routine_exercises: RoutineExercise[]
}

export interface RoutineLog {
  id: string
  user_id: string
  routine_id: string
  completed_at: string
}

// ─── Habits ───────────────────────────────────────────────────────────────

export interface Habit {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string
  created_at: string
}

// ─── Goals ───────────────────────────────────────────────────────────────

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  progress: number
  color: string | null
  target_date: string | null
  is_completed: boolean
  created_at: string
}

// ─── Mood & Gratitude ────────────────────────────────────────────────────

export interface MoodLog {
  id: string
  user_id: string
  mood: number
  note: string | null
  logged_date: string
  created_at: string
}

export interface GratitudeLog {
  id: string
  user_id: string
  entry_1: string
  entry_2: string | null
  entry_3: string | null
  logged_date: string
  created_at: string
}

// ─── Vouchers ────────────────────────────────────────────────────────────

export interface VoucherTemplate {
  id: string
  title: string
  description: string
  points_cost: number
  icon: string
  color: string
  created_at?: string
}

export interface Voucher {
  id: string
  user_id: string
  template_id?: string | null
  title: string
  description: string
  points_cost: number
  icon: string
  color: string
  is_redeemed: boolean
  redeemed_at: string | null
  created_at: string
}

// ─── Settings ─────────────────────────────────────────────────────────────

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

// ─── Gamification ─────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  category: string
  points: number
  is_secret: boolean
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievement?: Achievement
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
}

// ─── Cooking ──────────────────────────────────────────────────────────────

export type RecipeDifficulty = 'fácil' | 'media' | 'difícil'

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  total_time_minutes: number
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  difficulty: RecipeDifficulty
  cuisine_type: string | null
  tags: string[]
  user_prompt: string | null
  personal_notes: string | null
  is_favorite: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  order_index: number
  name: string
  amount: number | null
  unit: string | null
  notes: string | null
}

export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  title: string
  instructions: string
  duration_seconds: number | null
  temperature: string | null
  tip: string | null
}

export interface RecipeCookSession {
  id: string
  user_id: string
  recipe_id: string
  last_step_completed: number
  is_finished: boolean
  servings_cooked: number | null
  rating: number | null
  session_notes: string | null
  started_at: string
  finished_at: string | null
}

export interface RecipeWithDetails extends Recipe {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  active_session?: RecipeCookSession | null
}

export interface AIRecipeResponse {
  title: string
  description: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  difficulty: RecipeDifficulty
  cuisine_type: string
  tags: string[]
  ingredients: Array<{
    name: string
    amount: number | null
    unit: string | null
    notes: string | null
  }>
  steps: Array<{
    step_number: number
    title: string
    instructions: string
    duration_seconds: number | null
    temperature: string | null
    tip: string | null
  }>
}
