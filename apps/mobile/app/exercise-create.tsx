import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { suggestExerciseDescription } from '@/lib/ai'

export function CreateExerciseScreen() {
  const { session } = useSession()
  const [name, setName] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDescription, setAiDescription] = useState('')

  const handleAISuggest = async () => {
    if (!name.trim()) {
      Alert.alert('Por favor', 'Primero ingresa el nombre del ejercicio')
      return
    }

    setAiLoading(true)
    try {
      const suggestion = await suggestExerciseDescription(name)
      setAiDescription(suggestion.description)
      setDuration(String(suggestion.estimatedDuration || 60))
      setNotes(suggestion.description)
    } catch (error) {
      console.error('AI suggestion error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del ejercicio')
      return
    }

    if (!session?.user.id) {
      Alert.alert('Error', 'Sesión no encontrada')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('exercises').insert({
        user_id: session.user.id,
        name: name.trim(),
        sets: parseInt(sets) || 3,
        reps: parseInt(reps) || 10,
        duration_seconds: parseInt(duration) || 60,
        notes: notes.trim() || null,
      })

      if (error) throw error

      Alert.alert('¡Éxito!', 'Ejercicio creado', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el ejercicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-teal-100">
      <View className="px-5 py-6">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
          <Ionicons name="chevron-back" size={24} color="#0d9488" />
          <Text className="ml-2 text-lg font-bold text-teal-700">Volver</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-teal-900">Nuevo ejercicio</Text>
        <Text className="mt-1 text-sm font-semibold text-teal-600">
          Añade un ejercicio personalizado a tu banco
        </Text>

        {/* Exercise name */}
        <View className="mt-6 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <Text className="text-sm font-bold text-teal-900">Nombre del ejercicio</Text>
          <TextInput
            className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-base text-teal-900"
            placeholder="Ejemplo: Flexiones"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* AI Description suggestion */}
        <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-teal-900">Sugerencias con IA</Text>
            {aiDescription && (
              <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-3 py-1">
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text className="text-xs font-bold text-green-700">Aplicable</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="mt-3 flex-row items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50 py-3"
            onPress={handleAISuggest}
            disabled={aiLoading || !name.trim()}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color="#0d9488" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#0d9488" />
                <Text className="ml-2 font-bold text-teal-700">Obtener sugerencias</Text>
              </>
            )}
          </TouchableOpacity>

          {aiDescription && (
            <View className="mt-3 rounded-2xl bg-teal-50 p-3">
              <Text className="text-xs font-semibold text-teal-700">Descripción sugerida:</Text>
              <Text className="mt-1 text-sm font-semibold text-teal-900">{aiDescription}</Text>
            </View>
          )}
        </View>

        {/* Sets, reps, duration */}
        <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <Text className="text-sm font-bold text-teal-900">Configuración</Text>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-teal-600">Series</Text>
              <TextInput
                className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-base font-bold text-teal-900"
                keyboardType="number-pad"
                value={sets}
                onChangeText={setSets}
                editable={!loading}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-teal-600">Repeticiones</Text>
              <TextInput
                className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-base font-bold text-teal-900"
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
                editable={!loading}
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-teal-600">Segundos</Text>
              <TextInput
                className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-base font-bold text-teal-900"
                keyboardType="number-pad"
                value={duration}
                onChangeText={setDuration}
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-4">
          <Text className="text-sm font-bold text-teal-900">Notas (descripción completa)</Text>
          <TextInput
            className="mt-2 min-h-20 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-base text-teal-900"
            placeholder="Cómo hacerlo, posición correcta, respiración, etc."
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!loading}
            textAlignVertical="top"
          />
        </View>

        {/* Create button */}
        <TouchableOpacity
          className="mt-8 rounded-2xl bg-teal-600 py-4 disabled:opacity-60"
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Text className="text-center text-lg font-extrabold text-white">Crear ejercicio</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default CreateExerciseScreen
