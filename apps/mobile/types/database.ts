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
