import { Ionicons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/shared/lib/supabase'
import { useSession } from '@/src/core/providers/SessionContext'
import { useAchievement } from '@/src/core/providers/AchievementContext'
import { MochiCharacter } from '@/src/shared/components/MochiCharacter'
import { addPoints, unlockAchievement } from '@/src/shared/lib/gamification'

export function ExamLogScreen() {
  const { session } = useSession()
  const { showAchievement } = useAchievement()
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [examHistory, setExamHistory] = useState<
    Array<{ id: string; subject: string; grade: number; max_grade: number; exam_date: string }>
  >([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const todayISO = new Date().toISOString().slice(0, 10)

  const loadExamHistory = useCallback(async () => {
    if (!session?.user.id) {
      setExamHistory([])
      setLoadingHistory(false)
      return
    }

    try {
      setLoadingHistory(true)
      setHistoryError(null)

      const { data, error: fetchError } = await supabase
        .from('exam_logs')
        .select('id, subject, grade, max_grade, exam_date')
        .eq('user_id', session.user.id)
        .order('exam_date', { ascending: false })

      if (fetchError) throw fetchError

      setExamHistory(data ?? [])
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'No se pudo cargar el historial')
      setExamHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [session?.user.id])

  useFocusEffect(
    useCallback(() => {
      void loadExamHistory()
    }, [loadExamHistory])
  )

  function formatExamDate(value: string): string {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${value}T00:00:00`))

    return formatted.replace('.', '').toLowerCase()
  }

  function getResultBadge(gradeValue: number, maxGrade: number): {
    label: string
    className: string
  } {
    const percentage = gradeValue / maxGrade

    if (percentage >= 0.9) {
      return { label: 'Excelente', className: 'bg-green-200 text-green-900' }
    }

    if (percentage >= 0.7) {
      return { label: 'Aprobado', className: 'bg-yellow-200 text-yellow-900' }
    }

    return { label: 'Reprobado', className: 'bg-red-100 text-red-700' }
  }

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
        const unlockedExam = await unlockAchievement(session.user.id, 'exam_ace')
        if (unlockedExam) showAchievement(unlockedExam)
      }
      await loadExamHistory()
      setSubject('')
      setGrade('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS === 'ios'}
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

          <View className="mt-6 rounded-3xl border-2 border-pink-200 bg-white p-4">
            <Text className="text-lg font-extrabold text-pink-900">Mis exámenes</Text>

            {loadingHistory ? (
              <View className="items-center py-6">
                <ActivityIndicator size="small" color="#ec4899" />
                <Text className="mt-3 text-sm font-semibold text-pink-700">Cargando historial...</Text>
              </View>
            ) : historyError ? (
              <View className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-3">
                <Text className="text-sm font-semibold text-red-700">{historyError}</Text>
              </View>
            ) : examHistory.length === 0 ? (
              <View className="items-center py-6">
                <MochiCharacter mood="happy" size={70} />
                <Text className="mt-3 text-sm font-semibold text-pink-700">
                  Aún no tienes exámenes registrados
                </Text>
              </View>
            ) : (
              <View className="mt-4">
                {examHistory.map((exam) => {
                  const badge = getResultBadge(exam.grade, exam.max_grade)

                  return (
                    <View
                      key={exam.id}
                      className="mb-3 rounded-2xl border border-pink-200 bg-pink-50 p-3"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-base font-extrabold text-pink-900">{exam.subject}</Text>
                          <Text className="mt-1 text-sm font-semibold text-pink-700">
                            {exam.grade}/{exam.max_grade}
                          </Text>
                          <Text className="mt-1 text-xs font-semibold uppercase text-pink-500">
                            {formatExamDate(exam.exam_date)}
                          </Text>
                        </View>
                        <View className={`rounded-full px-3 py-1 ${badge.className}`}>
                          <Text className="text-xs font-bold">{badge.label}</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
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
