import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/src/shared/lib/supabase'
import { useSession } from '@/src/core/providers/SessionContext'
import { useAchievement } from '@/src/core/providers/AchievementContext'
import { MochiCharacter } from '@/src/shared/components/MochiCharacter'
import { addPoints, trackEngagementEvent, unlockAchievement } from '@/src/shared/lib/gamification'
import { scheduleExamReminder } from '@/src/shared/lib/notifications'

type TabId = 'results' | 'upcoming'

type ExamResultItem = {
  id: string
  subject: string
  grade: number | null
  max_grade: number | null
  exam_date: string
  notes: string | null
}

type UpcomingExamItem = {
  id: string
  subject: string
  exam_date: string
  preparation_notes: string | null
}

export function ExamLogScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const { showAchievement } = useAchievement()

  const [activeTab, setActiveTab] = useState<TabId>('results')

  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedUpcomingId, setSelectedUpcomingId] = useState<string | null>(null)

  const [upcomingSubject, setUpcomingSubject] = useState('')
  const [upcomingDate, setUpcomingDate] = useState('')
  const [upcomingNotes, setUpcomingNotes] = useState('')

  const [examHistory, setExamHistory] = useState<ExamResultItem[]>([])
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUpcoming, setSavingUpcoming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gamificationWarning, setGamificationWarning] = useState<string | null>(null)
  const saveResultMutexRef = useRef(false)

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const loadExams = useCallback(async () => {
    if (!session?.user.id) {
      setExamHistory([])
      setUpcomingExams([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [historyRes, upcomingRes] = await Promise.all([
        supabase
          .from('exam_logs')
          .select('id, subject, grade, max_grade, exam_date, notes')
          .eq('user_id', session.user.id)
          .or('is_upcoming.is.false,is_upcoming.is.null')
          .order('exam_date', { ascending: false }),
        supabase
          .from('exam_logs')
          .select('id, subject, exam_date, preparation_notes')
          .eq('user_id', session.user.id)
          .gte('exam_date', todayISO)
          .eq('is_upcoming', true)
          .order('exam_date', { ascending: true }),
      ])

      if (historyRes.error) throw historyRes.error
      if (upcomingRes.error) throw upcomingRes.error

      setExamHistory((historyRes.data as ExamResultItem[] | null) ?? [])
      setUpcomingExams((upcomingRes.data as UpcomingExamItem[] | null) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información de exámenes')
      setExamHistory([])
      setUpcomingExams([])
    } finally {
      setLoading(false)
    }
  }, [session?.user.id, todayISO])

  useFocusEffect(
    useCallback(() => {
      void loadExams()
    }, [loadExams])
  )

  function formatExamDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    })
      .format(new Date(`${value}T00:00:00`))
      .replace('.', '')
      .toLowerCase()
  }

  function getResultBadge(gradeValue: number, maxGrade: number): { label: string; className: string } {
    const percentage = gradeValue / maxGrade

    if (percentage >= 0.9) {
      return { label: 'Excelente', className: 'bg-green-200 text-green-900' }
    }

    if (percentage >= 0.7) {
      return { label: 'Aprobado', className: 'bg-yellow-200 text-yellow-900' }
    }

    return { label: 'Reprobado', className: 'bg-red-100 text-red-700' }
  }

  function getDaysUntil(value: string): number {
    const start = new Date(`${todayISO}T00:00:00`).getTime()
    const end = new Date(`${value}T00:00:00`).getTime()
    return Math.round((end - start) / (1000 * 60 * 60 * 24))
  }

  function getUpcomingLabel(value: string): string {
    const days = getDaysUntil(value)
    if (days <= 0) return '¡Hoy!'
    if (days === 1) return 'Mañana'
    return `En ${days} días`
  }

  async function handleSaveResult() {
    if (saving || saveResultMutexRef.current) return

    saveResultMutexRef.current = true

    if (!subject.trim()) {
      setError('Por favor ingresa la materia')
      saveResultMutexRef.current = false
      return
    }

    const gradeNum = parseFloat(grade)
    if (Number.isNaN(gradeNum) || gradeNum < 0 || gradeNum > 10) {
      setError('La nota debe ser un número entre 0 y 10')
      saveResultMutexRef.current = false
      return
    }

    if (!session?.user.id) {
      setError('No hay sesión activa')
      saveResultMutexRef.current = false
      return
    }

    setSaving(true)
    setError(null)
    setGamificationWarning(null)

    try {
      const occurredAt = new Date().toISOString()
      let examLogId = selectedUpcomingId

      if (selectedUpcomingId) {
        const { error: updateError } = await supabase
          .from('exam_logs')
          .update({
            subject: subject.trim(),
            grade: gradeNum,
            max_grade: 10,
            notes: notes.trim() || null,
            is_upcoming: false,
          })
          .eq('id', selectedUpcomingId)
          .eq('user_id', session.user.id)

        if (updateError) throw updateError
      } else {
        const { data: insertedExam, error: insertError } = await supabase
          .from('exam_logs')
          .insert({
            user_id: session.user.id,
            subject: subject.trim(),
            grade: gradeNum,
            max_grade: 10,
            notes: notes.trim() || null,
            exam_date: todayISO,
            is_upcoming: false,
          })
          .select('id')
          .single<{ id: string }>()

        if (insertError || !insertedExam) {
          throw insertError ?? new Error('No se pudo confirmar el resultado registrado')
        }

        examLogId = insertedExam.id
      }

      let engagementResult: 'created' | 'duplicate' | null = null

      if (examLogId) {
        try {
          engagementResult = await trackEngagementEvent({
            userId: session.user.id,
            eventName: 'exam_result_logged',
            eventKey: `exam_result_logged:${examLogId}`,
            sourceTable: 'exam_logs',
            sourceId: examLogId,
            occurredAt,
            payload: {
              exam_log_id: examLogId,
              subject: subject.trim(),
              grade: gradeNum,
              max_grade: 10,
              is_upcoming_source: Boolean(selectedUpcomingId),
            },
          })
        } catch (trackingError) {
          setGamificationWarning(
            'El resultado se guardó, pero no pudimos registrar el evento de gamificación. Intenta de nuevo más tarde.'
          )
          console.warn('No se pudo registrar el evento de engagement de examen:', trackingError)
        }
      }

      const percentage = gradeNum / 10
      if (percentage >= 0.7 && engagementResult === 'created') {
        await addPoints(session.user.id, 20, showAchievement)
        const unlockedExam = await unlockAchievement(session.user.id, 'exam_ace')
        if (unlockedExam) showAchievement(unlockedExam)
      }

      if (percentage >= 0.7 && engagementResult === 'duplicate') {
        setGamificationWarning(
          'Este resultado ya estaba registrado en gamificación. No se volvieron a sumar puntos para evitar duplicados.'
        )
        console.warn('Evento de engagement duplicado para resultado de examen. Se omite suma de puntos/logros.')
      }

      setSubject('')
      setGrade('')
      setNotes('')
      setSelectedUpcomingId(null)
      await loadExams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el resultado')
    } finally {
      setSaving(false)
      saveResultMutexRef.current = false
    }
  }

  async function handleSaveUpcoming() {
    if (!upcomingSubject.trim()) {
      setError('Por favor ingresa la materia del próximo examen')
      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(upcomingDate)) {
      setError('Usa fecha en formato AAAA-MM-DD')
      return
    }

    if (upcomingDate < todayISO) {
      setError('La fecha debe ser hoy o futura')
      return
    }

    if (!session?.user.id) {
      setError('No hay sesión activa')
      return
    }

    setSavingUpcoming(true)
    setError(null)
    setGamificationWarning(null)

    try {
      const { data, error: insertError } = await supabase
        .from('exam_logs')
        .insert({
          user_id: session.user.id,
          subject: upcomingSubject.trim(),
          exam_date: upcomingDate,
          grade: null,
          max_grade: null,
          notes: null,
          preparation_notes: upcomingNotes.trim() || null,
          is_upcoming: true,
        })
        .select('id, subject, exam_date')
        .single()

      if (insertError) throw insertError

      await scheduleExamReminder(data.id, data.subject, data.exam_date)

      setUpcomingSubject('')
      setUpcomingDate('')
      setUpcomingNotes('')
      await loadExams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el examen próximo')
    } finally {
      setSavingUpcoming(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          <TouchableOpacity className="mt-4 flex-row items-center" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#9d174d" />
            <Text className="ml-1 font-bold text-pink-800">Volver</Text>
          </TouchableOpacity>

          <View className="mt-6">
            <Text className="text-2xl font-extrabold text-pink-900">Exámenes</Text>
            <Text className="mt-1 text-sm font-semibold capitalize text-pink-500">{today}</Text>
          </View>

          <View className="mt-4 flex-row rounded-2xl border border-pink-200 bg-white p-1">
            <TouchableOpacity
              className={`flex-1 items-center rounded-xl py-2 ${activeTab === 'results' ? 'bg-pink-500' : ''}`}
              onPress={() => setActiveTab('results')}
            >
              <Text className={`text-sm font-bold ${activeTab === 'results' ? 'text-white' : 'text-pink-700'}`}>
                Registrar resultado
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center rounded-xl py-2 ${activeTab === 'upcoming' ? 'bg-pink-500' : ''}`}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text className={`text-sm font-bold ${activeTab === 'upcoming' ? 'text-white' : 'text-pink-700'}`}>
                Próximos exámenes
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-3">
              <Text className="text-sm font-semibold text-red-700">{error}</Text>
            </View>
          ) : null}

          {gamificationWarning ? (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <Text className="text-sm font-semibold text-amber-700">{gamificationWarning}</Text>
            </View>
          ) : null}

          {activeTab === 'results' ? (
            <>
              {selectedUpcomingId ? (
                <View className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
                  <Text className="text-xs font-bold text-indigo-700">Resultado de examen próximo</Text>
                  <Text className="mt-1 text-sm font-semibold text-indigo-900">
                    Completa la nota para cerrar este examen pendiente.
                  </Text>
                </View>
              ) : null}

              <View className="mt-6 rounded-3xl border-2 border-pink-200 bg-white p-4">
                <Text className="text-lg font-extrabold text-pink-900">Historial de resultados</Text>

                {loading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#ec4899" />
                    <Text className="mt-3 text-sm font-semibold text-pink-700">Cargando historial...</Text>
                  </View>
                ) : examHistory.length === 0 ? (
                  <View className="items-center py-6">
                    <MochiCharacter mood="happy" size={70} />
                    <Text className="mt-3 text-sm font-semibold text-pink-700">
                      Aún no tienes resultados registrados
                    </Text>
                  </View>
                ) : (
                  <View className="mt-4">
                    {examHistory.map((exam) => {
                      const gradeValue = exam.grade ?? 0
                      const maxValue = exam.max_grade ?? 10
                      const badge = getResultBadge(gradeValue, maxValue)

                      return (
                        <View key={exam.id} className="mb-3 rounded-2xl border border-pink-200 bg-pink-50 p-3">
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 pr-3">
                              <Text className="text-base font-extrabold text-pink-900">{exam.subject}</Text>
                              <Text className="mt-1 text-sm font-semibold text-pink-700">
                                {gradeValue}/{maxValue}
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

              <TouchableOpacity
                className={`mt-6 items-center rounded-2xl py-4 ${saving ? 'bg-pink-300' : 'bg-pink-500'}`}
                onPress={() => {
                  void handleSaveResult()
                }}
                disabled={saving}
              >
                <Text className="font-extrabold text-white">{saving ? 'Guardando...' : 'Guardar resultado'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="mt-6 rounded-3xl border-2 border-pink-200 bg-white p-4">
                <Text className="text-lg font-extrabold text-pink-900">Próximos exámenes</Text>

                {loading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#ec4899" />
                  </View>
                ) : upcomingExams.length === 0 ? (
                  <View className="items-center py-6">
                    <MochiCharacter mood="thinking" size={70} />
                    <Text className="mt-3 text-sm font-semibold text-pink-700">
                      No hay exámenes próximos registrados
                    </Text>
                  </View>
                ) : (
                  <View className="mt-4">
                    {upcomingExams.map((exam) => (
                      <View key={exam.id} className="mb-3 rounded-2xl border border-pink-200 bg-pink-50 p-3">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-extrabold text-pink-900">{exam.subject}</Text>
                          <View className="rounded-full bg-amber-100 px-2 py-1">
                            <Text className="text-xs font-bold text-amber-700">{getUpcomingLabel(exam.exam_date)}</Text>
                          </View>
                        </View>
                        <Text className="mt-1 text-xs font-semibold uppercase text-pink-500">
                          {formatExamDate(exam.exam_date)}
                        </Text>
                        {exam.preparation_notes ? (
                          <Text className="mt-1 text-xs font-semibold text-pink-700">{exam.preparation_notes}</Text>
                        ) : null}
                        <TouchableOpacity
                          className="mt-2 self-start rounded-xl bg-white px-3 py-1"
                          onPress={() => {
                            setSubject(exam.subject)
                            setGrade('')
                            setNotes('')
                            setSelectedUpcomingId(exam.id)
                            setActiveTab('results')
                          }}
                        >
                          <Text className="text-xs font-bold text-pink-700">Registrar resultado</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View className="mt-6">
                <Text className="mb-2 text-sm font-bold text-pink-800">Materia</Text>
                <TextInput
                  className="rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                  placeholder="Ej. Biología"
                  placeholderTextColor="#f9a8d4"
                  value={upcomingSubject}
                  onChangeText={setUpcomingSubject}
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-sm font-bold text-pink-800">Fecha futura (AAAA-MM-DD)</Text>
                <TextInput
                  className="rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                  placeholder="2026-04-10"
                  placeholderTextColor="#f9a8d4"
                  value={upcomingDate}
                  onChangeText={setUpcomingDate}
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-sm font-bold text-pink-800">Notas de preparación</Text>
                <TextInput
                  className="rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                  placeholder="Temas a repasar, fórmulas, prioridades..."
                  placeholderTextColor="#f9a8d4"
                  value={upcomingNotes}
                  onChangeText={setUpcomingNotes}
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: 'top', minHeight: 80 }}
                />
              </View>

              <TouchableOpacity
                className={`mt-6 items-center rounded-2xl py-4 ${savingUpcoming ? 'bg-pink-300' : 'bg-pink-500'}`}
                onPress={() => {
                  void handleSaveUpcoming()
                }}
                disabled={savingUpcoming}
              >
                <Text className="font-extrabold text-white">
                  {savingUpcoming ? 'Guardando...' : 'Guardar examen próximo'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ExamLogScreen
