import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/context/SessionContext'
import { MochiCharacter } from '@/components/MochiCharacter'
import { addPoints, unlockAchievement } from '@/lib/gamification'

function getResultMessage(percentage: number): string {
  if (percentage >= 0.9) return '¡Excelente resultado!'
  if (percentage >= 0.7) return '¡Buen trabajo!'
  return 'Sigue adelante, lo harás mejor'
}

export function ExamLogScreen() {
  const { session } = useSession()
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedPercentage, setSavedPercentage] = useState(0)

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const todayISO = new Date().toISOString().slice(0, 10)

  async function handleSave() {
    if (!subject.trim()) {
      setError('Por favor ingresa la materia')
      return
    }
    const gradeNum = parseFloat(grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      setError('La nota debe ser un número entre 0 y 10')
      return
    }
    if (!session?.user.id) {
      setError('No hay sesión activa')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: sbError } = await supabase.from('exam_logs').insert({
        user_id: session.user.id,
        subject: subject.trim(),
        grade: gradeNum,
        max_grade: 10,
        notes: notes.trim() || null,
        exam_date: todayISO,
      })
      if (sbError) throw sbError

      const percentage = gradeNum / 10
      if (percentage >= 0.7) {
        await addPoints(session.user.id, 20)
        await unlockAchievement(session.user.id, 'exam_ace')
      }
      setSavedPercentage(percentage)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    const resultMessage = getResultMessage(savedPercentage)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-pink-50 px-6">
        <MochiCharacter mood={savedPercentage >= 0.7 ? 'excited' : 'happy'} size={120} />
        <Text className="mt-6 text-2xl font-extrabold text-pink-900">{resultMessage}</Text>
        <Text className="mt-2 text-sm font-semibold text-pink-600">
          {subject} — {grade}/10
        </Text>
        {savedPercentage >= 0.7 && (
          <View className="mt-4 rounded-full bg-yellow-200 px-5 py-2">
            <Text className="font-extrabold text-yellow-900">+20 puntos</Text>
          </View>
        )}
        <TouchableOpacity
          className="mt-8 rounded-2xl bg-pink-500 px-8 py-4"
          onPress={() => router.back()}
        >
          <Text className="font-extrabold text-white">Volver al inicio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          <TouchableOpacity className="mt-4 flex-row items-center" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#9d174d" />
            <Text className="ml-1 font-bold text-pink-800">Volver</Text>
          </TouchableOpacity>

          <View className="mt-6">
            <Text className="text-2xl font-extrabold text-pink-900">Registrar examen</Text>
            <Text className="mt-1 text-sm font-semibold capitalize text-pink-500">{today}</Text>
          </View>

          <View className="mt-6">
            <Text className="mb-2 text-sm font-bold text-pink-800">Materia</Text>
            <TextInput
              className="rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              placeholder="Ej. Cálculo, Historia, Inglés..."
              placeholderTextColor="#f9a8d4"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-pink-800">Nota obtenida</Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                placeholder="0 - 10"
                placeholderTextColor="#f9a8d4"
                value={grade}
                onChangeText={setGrade}
                keyboardType="decimal-pad"
              />
              <View className="ml-3 items-center justify-center rounded-2xl bg-pink-100 px-4 py-3">
                <Text className="font-bold text-pink-700">/ 10</Text>
              </View>
            </View>
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-bold text-pink-800">Notas (opcional)</Text>
            <TextInput
              className="rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              placeholder="¿Qué temas entraron? ¿Cómo te fue?"
              placeholderTextColor="#f9a8d4"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>

          {error ? (
            <View className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-3">
              <Text className="text-sm font-semibold text-red-700">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className={`mt-6 mb-8 items-center rounded-2xl py-4 ${saving ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text className="font-extrabold text-white">
              {saving ? 'Guardando...' : 'Guardar examen'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ExamLogScreen
