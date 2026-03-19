import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { RoutineWithExercises } from '@/types/database'

const colorMap: Record<string, string> = {
  teal: 'bg-teal-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-200',
  blue: 'bg-blue-200',
  yellow: 'bg-yellow-200',
  green: 'bg-green-200',
}

const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function ExerciseRoutine() {
  const { session } = useSession()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    async function loadRoutines() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: supabaseError } = await supabase
          .from('routines')
          .select(
            `*,
             routine_exercises (
               id,
               routine_id,
               exercise_id,
               order_index,
               exercise:exercises (id, name, sets, reps, duration_seconds, notes)
             )`
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (supabaseError) throw supabaseError
        setRoutines(data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando rutinas')
        setRoutines([])
      } finally {
        setLoading(false)
      }
    }

    loadRoutines()
  }, [session?.user.id])

  const handleTotalTime = (routine: RoutineWithExercises): string => {
    const totalSeconds = routine.routine_exercises.reduce((sum, re) => {
      return sum + (re.exercise?.duration_seconds ?? 0)
    }, 0)
    const minutes = Math.ceil(totalSeconds / 60)
    return `${minutes} min`
  }

  return (
    <View className="flex-1 bg-teal-100 px-5 pt-12">
      <View className="mb-6 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl border-2 border-teal-200 bg-white">
          <Ionicons name="barbell" size={20} color="#0d9488" />
        </View>
        <Text className="ml-3 text-2xl font-extrabold text-teal-900">Mis rutinas</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text className="mt-4 text-sm font-semibold text-teal-700">Cargando rutinas...</Text>
          </View>
        ) : error ? (
          <View className="rounded-3xl border-2 border-red-200 bg-red-50 p-4">
            <Text className="text-sm font-semibold text-red-700">{error}</Text>
          </View>
        ) : routines.length === 0 ? (
          <View className="rounded-3xl border-2 border-teal-200 bg-white p-6">
            <View className="items-center">
              <Ionicons name="barbell" size={48} color="#7ee8c1" />
              <Text className="mt-3 text-center text-sm font-semibold text-teal-600">
                Crea tu primera rutina de ejercicio
              </Text>
            </View>
          </View>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              className="mb-4 rounded-3xl border-2 border-teal-200 bg-white p-5"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-xl font-extrabold text-slate-800">{routine.name}</Text>
                  <View className="mt-2 flex-row">
                    {routine.days.map((dayNum) => (
                      <View
                        key={`${routine.id}-${dayNum}`}
                        className={`mr-2 rounded-full px-2 py-1 ${'bg-teal-200'}`}
                      >
                        <Text className="text-xs font-bold text-slate-700">
                          {dayMap[dayNum] ?? '?'}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text className="mt-2 text-sm font-semibold text-slate-600">
                    {routine.routine_exercises.length} ejercicios • {handleTotalTime(routine)}
                  </Text>
                </View>

                <TouchableOpacity className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-200">
                  <Ionicons name="play" size={18} color="#0d9488" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        className="mb-6 mt-4 flex-row items-center justify-center rounded-2xl bg-teal-500 py-4"
        onPress={() => router.push('/exercise-create')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="ml-2 text-base font-extrabold text-white">Añadir ejercicio</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ExerciseRoutine
