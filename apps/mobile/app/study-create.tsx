import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/src/shared/lib/supabase'
import { useSession } from '@/src/core/providers/SessionContext'
import TimePickerModal from '@/src/shared/components/TimePickerModal'
import { suggestStudyDuration } from '@/src/shared/lib/ai'
import { useCustomAlert } from '@/src/shared/components/CustomAlert'

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const colors = [
  { value: 'pink', label: '🌸 Rosa', hex: '#fce7f3' },
  { value: 'blue', label: '💙 Azul', hex: '#dbeafe' },
  { value: 'yellow', label: '💛 Amarillo', hex: '#fef3c7' },
  { value: 'teal', label: '💚 Teal', hex: '#ccfbf1' },
  { value: 'purple', label: '💜 Púrpura', hex: '#e9d5ff' },
  { value: 'green', label: '💚 Verde', hex: '#dcfce7' },
]

export function CreateStudyBlockScreen() {
  const { session } = useSession()
  const { showAlert, AlertComponent } = useCustomAlert()
  const [subject, setSubject] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:30')
  const [color, setColor] = useState('pink')
  const [loading, setLoading] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const handleAISuggestDuration = async () => {
    if (!subject.trim()) {
      showAlert({
        title: 'Por favor',
        message: 'Primero ingresa la materia',
        buttons: [{ text: 'Aceptar' }],
      })
      return
    }

    setAiLoading(true)
    try {
      const minutes = await suggestStudyDuration(subject)
      const start = parseInt(startTime.split(':')[0])
      const end = start + Math.floor(minutes / 60)
      const mins = minutes % 60

      setEndTime(`${String(end).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
    } catch (error) {
      console.error('AI suggestion error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!subject.trim()) {
      showAlert({
        title: 'Error',
        message: 'Por favor ingresa la materia',
        buttons: [{ text: 'Aceptar', style: 'cancel' }],
      })
      return
    }

    if (!session?.user.id) {
      showAlert({
        title: 'Error',
        message: 'Sesión no encontrada',
        buttons: [{ text: 'Aceptar', style: 'cancel' }],
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('study_blocks').insert({
        user_id: session.user.id,
        subject: subject.trim(),
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        color,
      })

      if (error) throw error

      showAlert({
        title: '¡Éxito!',
        message: 'Bloque de estudio creado',
        buttons: [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      })
    } catch (error) {
      showAlert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo crear el bloque',
        buttons: [{ text: 'Entendido', style: 'destructive' }],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ScrollView className="flex-1 bg-purple-100">
        <View className="px-5 py-6">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} className="mb-4 flex-row items-center">
          <Ionicons name="chevron-back" size={24} color="#7c3aed" />
          <Text className="ml-2 text-lg font-bold text-purple-700">Volver</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-extrabold text-purple-900">Nuevo bloque de estudio</Text>
        <Text className="mt-1 text-sm font-semibold text-purple-600">
          Crea un bloque personalizado para tu horario
        </Text>

        {/* Subject input */}
        <View className="mt-6 rounded-3xl border-2 border-purple-200 bg-white p-4">
          <Text className="text-sm font-bold text-purple-900">Materia</Text>
          <TextInput
            className="mt-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-base text-purple-900"
            placeholder="Ejemplo: Matemáticas"
            value={subject}
            onChangeText={setSubject}
            editable={!loading}
          />
          <Text className="mt-2 text-xs font-semibold text-purple-600">
            Sé específica: "Cálculo" es mejor que "Matemáticas"
          </Text>
        </View>

        {/* Day selector */}
        <View className="mt-4 rounded-3xl border-2 border-purple-200 bg-white p-4">
          <Text className="text-sm font-bold text-purple-900">Día de la semana</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-2">
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day.value}
                className={`mx-2 rounded-2xl px-4 py-2 ${dayOfWeek === day.value ? 'bg-purple-600' : 'bg-purple-100'}`}
                onPress={() => setDayOfWeek(day.value)}
              >
                <Text
                  className={`font-bold ${dayOfWeek === day.value ? 'text-white' : 'text-purple-700'}`}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time selectors */}
        <View className="mt-4 rounded-3xl border-2 border-purple-200 bg-white p-4">
          <Text className="text-sm font-bold text-purple-900">Horario</Text>

          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-purple-600">Inicio</Text>
              <TouchableOpacity
                className="mt-2 rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3"
                onPress={() => setShowStartPicker(true)}
              >
                <Text className="text-center text-lg font-extrabold text-purple-900">{startTime}</Text>
              </TouchableOpacity>
            </View>

            <View className="items-center justify-center">
              <Ionicons name="arrow-forward" size={20} color="#a855f7" />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-purple-600">Fin</Text>
              <TouchableOpacity
                className="mt-2 rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3"
                onPress={() => setShowEndPicker(true)}
              >
                <Text className="text-center text-lg font-extrabold text-purple-900">{endTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Duration suggestion */}
          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-100 to-yellow-50 py-3"
            onPress={handleAISuggestDuration}
            disabled={aiLoading || !subject.trim()}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#a855f7" />
                <Text className="ml-2 font-bold text-purple-700">Sugerir duración con IA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Color selector */}
        <View className="mt-4 rounded-3xl border-2 border-purple-200 bg-white p-4">
          <Text className="text-sm font-bold text-purple-900">Color</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {colors.map((col) => (
              <TouchableOpacity
                key={col.value}
                className={`flex-1 min-w-[28%] rounded-2xl border-4 py-3 ${color === col.value ? 'border-purple-700' : 'border-transparent'}`}
                style={{ backgroundColor: col.hex }}
                onPress={() => setColor(col.value)}
              >
                <Text className="text-center text-xs font-bold text-purple-900">{col.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create button */}
          <TouchableOpacity
            className="mt-8 rounded-2xl bg-purple-600 py-4 disabled:opacity-60"
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <Text className="text-center text-lg font-extrabold text-white">Crear bloque de estudio</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Time pickers */}
        <TimePickerModal
          visible={showStartPicker}
          time={startTime}
          label="Hora de inicio"
          onConfirm={(time) => {
            setStartTime(time)
            setShowStartPicker(false)
          }}
          onCancel={() => setShowStartPicker(false)}
        />

        <TimePickerModal
          visible={showEndPicker}
          time={endTime}
          label="Hora de fin"
          onConfirm={(time) => {
            setEndTime(time)
            setShowEndPicker(false)
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      </ScrollView>
      {AlertComponent}
    </>
  )
}

export default CreateStudyBlockScreen
