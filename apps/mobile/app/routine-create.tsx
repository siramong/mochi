import { useCallback, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import type { Exercise } from '@/types/database'

const days = [
  { id: 1, short: 'L', label: 'Lunes' },
  { id: 2, short: 'M', label: 'Martes' },
  { id: 3, short: 'X', label: 'Miércoles' },
  { id: 4, short: 'J', label: 'Jueves' },
  { id: 5, short: 'V', label: 'Viernes' },
  { id: 6, short: 'S', label: 'Sábado' },
  { id: 0, short: 'D', label: 'Domingo' },
]

export function RoutineCreateScreen() {
  const { session } = useSession()
  const [routineName, setRoutineName] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    if (!session?.user.id) {
      setExercises([])
      setLoadingExercises(false)
      return
    }

    try {
      setLoadingExercises(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      setExercises(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los ejercicios')
      setExercises([])
    } finally {
      setLoadingExercises(false)
    }
  }, [session?.user.id])

  useFocusEffect(
    useCallback(() => {
      void loadExercises()
    }, [loadExercises])
  )

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((current) => current !== dayId) : [...prev, dayId]
    )
  }

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((currentId) => currentId !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const handleCreateRoutine = async () => {
    if (!session?.user.id) {
      Alert.alert('Error', 'Sesión no encontrada')
      return
    }

    if (!routineName.trim()) {
      Alert.alert('Falta información', 'Escribe un nombre para la rutina')
      return
    }

    if (selectedDays.length === 0) {
      Alert.alert('Falta información', 'Selecciona al menos un día')
      return
    }

    if (selectedExerciseIds.length === 0) {
      Alert.alert('Falta información', 'Selecciona al menos un ejercicio')
      return
    }

    try {
      setSaving(true)

      const orderedDays = [...selectedDays].sort((a, b) => a - b)

      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert({
          user_id: session.user.id,
          name: routineName.trim(),
          days: orderedDays,
        })
        .select('id')
        .single()

      if (routineError) throw routineError

      const routineExercisesPayload = selectedExerciseIds.map((exerciseId, index) => ({
        routine_id: routineData.id,
        exercise_id: exerciseId,
        order_index: index,
      }))

      const { error: routineExercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercisesPayload)

      if (routineExercisesError) throw routineExercisesError

      Alert.alert('Rutina creada', 'Tu rutina se guardó correctamente', [
        {
          text: 'Continuar',
          onPress: () => router.back(),
        },
      ])
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo crear la rutina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-teal-100">
      <View className="px-5 py-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
          <Ionicons name="chevron-back" size={24} color="#0d9488" />
          <Text className="ml-2 text-lg font-bold text-teal-700">Volver</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-teal-900">Nueva rutina</Text>
        <Text className="mt-1 text-sm font-semibold text-teal-600">
          Crea una rutina con tus ejercicios guardados
        </Text>

        <View className="mt-6 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <Text className="text-sm font-bold text-teal-900">Nombre de la rutina</Text>
          <TextInput
            className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-base text-teal-900"
            placeholder="Ejemplo: Fuerza de tren inferior"
            value={routineName}
            onChangeText={setRoutineName}
            editable={!saving}
          />
        </View>

        <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <Text className="text-sm font-bold text-teal-900">Días de entrenamiento</Text>
          <View className="mt-3 flex-row flex-wrap">
            {days.map((day) => {
              const active = selectedDays.includes(day.id)

              return (
                <TouchableOpacity
                  key={day.id}
                  className={`mb-2 mr-2 rounded-2xl border px-4 py-3 ${active ? 'border-teal-600 bg-teal-500' : 'border-teal-200 bg-teal-50'}`}
                  onPress={() => toggleDay(day.id)}
                  disabled={saving}
                >
                  <Text className={`text-sm font-extrabold ${active ? 'text-white' : 'text-teal-800'}`}>
                    {day.short}
                  </Text>
                  <Text className={`text-xs font-semibold ${active ? 'text-teal-50' : 'text-teal-600'}`}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-teal-900">Ejercicios para la rutina</Text>
            <TouchableOpacity
              className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2"
              onPress={() => router.push('/exercise-create?returnTo=/routine-create')}
              disabled={saving}
            >
              <Text className="text-xs font-bold text-teal-700">Añadir ejercicio nuevo</Text>
            </TouchableOpacity>
          </View>

          {loadingExercises ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="#14b8a6" />
              <Text className="mt-3 text-sm font-semibold text-teal-700">Cargando ejercicios...</Text>
            </View>
          ) : error ? (
            <View className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm font-semibold text-red-700">{error}</Text>
            </View>
          ) : exercises.length === 0 ? (
            <View className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <Text className="text-sm font-semibold text-teal-700">
                Aún no tienes ejercicios guardados. Crea el primero para armar tu rutina.
              </Text>
            </View>
          ) : (
            <View className="mt-4">
              {exercises.map((exercise) => {
                const isSelected = selectedExerciseIds.includes(exercise.id)

                return (
                  <TouchableOpacity
                    key={exercise.id}
                    className="mb-3 flex-row items-center rounded-2xl border border-teal-100 bg-teal-50 p-3"
                    onPress={() => toggleExercise(exercise.id)}
                    disabled={saving}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? '#0d9488' : '#94a3b8'}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-slate-800">{exercise.name}</Text>
                      <Text className="text-xs font-semibold text-slate-600">
                        {exercise.sets} series • {exercise.reps} repeticiones • {Math.ceil(exercise.duration_seconds / 60)} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          className="mb-10 mt-8 rounded-2xl bg-teal-600 py-4 disabled:opacity-60"
          onPress={handleCreateRoutine}
          disabled={saving || loadingExercises}
        >
          {saving ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Text className="text-center text-lg font-extrabold text-white">Guardar rutina</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default RoutineCreateScreen