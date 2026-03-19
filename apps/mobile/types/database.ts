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

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  is_completed: boolean
  created_at: string
}

export interface MoodLog {
  id: string
  user_id: string
  mood: string
  notes: string | null
  log_date: string
  created_at: string
}

export interface GratitudeLog {
  id: string
  user_id: string
  content: string
  log_date: string
  created_at: string
}

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
