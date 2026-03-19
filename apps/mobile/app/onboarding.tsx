import { useMemo, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { MochiCharacter } from '@/components/MochiCharacter'
import TimePickerModal from '@/components/TimePickerModal'
import {
  requestNotificationPermissions,
  saveNotificationPrefs,
  scheduleMorningReminder,
} from '@/lib/notifications'

export function OnboardingScreen() {
  const [fullName, setFullName] = useState('')
  const [wakeUpTime, setWakeUpTime] = useState('05:20')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formIsValid = useMemo(() => {
    return fullName.trim().length > 1
  }, [fullName])

  async function handleConfirm() {
    const trimmedName = fullName.trim()

    if (trimmedName.length < 2) {
      setError('Escribe tu nombre completo para continuar')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message ?? 'No se encontró sesión activa')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          wake_up_time: wakeUpTime,
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Request notification permission and schedule morning reminder
      const permissionStatus = await requestNotificationPermissions()
      if (permissionStatus === 'granted') {
        await saveNotificationPrefs({
          enabled: true,
          morningEnabled: true,
          studyEnabled: true,
          habitEnabled: true,
        })
        await scheduleMorningReminder(wakeUpTime)
      }

      router.replace('/')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar tu perfil'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-teal-100 px-6 pt-16">
      <View className="absolute right-10 top-10 h-12 w-12 items-center justify-center rounded-2xl bg-yellow-200">
        <Ionicons name="star" size={22} />
      </View>

      <View className="mb-5 items-center">
        <MochiCharacter mood="excited" size={90} />
        <Text className="mt-3 text-sm font-semibold text-teal-700">Estoy lista para acompañarte hoy</Text>
      </View>

      <View className="mb-8">
        <Text className="text-4xl font-extrabold text-teal-900">Bienvenida a Mochi</Text>
        <Text className="mt-2 text-lg font-semibold text-teal-700">Configuremos tu perfil</Text>
      </View>

      <View className="rounded-3xl border-2 border-teal-200 bg-white/80 p-5">
        <Text className="text-sm font-bold text-teal-900">¿Cuál es tu nombre?</Text>
        <TextInput
          className="mt-2 rounded-3xl border-2 border-teal-200 bg-white px-4 py-4 text-base text-teal-900"
          placeholder="Tu nombre bonito"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
          maxLength={60}
        />

        <Text className="mt-4 text-sm font-bold text-teal-900">¿A qué hora despiertas?</Text>
        <TouchableOpacity
          className="mt-2 rounded-3xl border-2 border-teal-200 bg-white px-4 py-4"
          onPress={() => setShowTimePicker(true)}
          disabled={loading}
        >
          <Text className="text-center text-2xl font-extrabold text-teal-900">{wakeUpTime}</Text>
        </TouchableOpacity>

        {error ? <Text className="mt-3 text-sm text-purple-900">{error}</Text> : null}

        <TouchableOpacity
          className="mt-5 flex-row items-center justify-center rounded-3xl bg-teal-500 px-4 py-4 disabled:opacity-60"
          disabled={loading || !formIsValid}
          onPress={() => {
            void handleConfirm()
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text className="text-base font-extrabold text-white">Continuar</Text>
              <Ionicons name="arrow-forward" size={18} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-5 rounded-3xl border border-teal-200 bg-white/70 p-4">
        <Text className="text-center text-sm text-teal-800">
          Puedes cambiar estos datos luego desde tu perfil.
        </Text>
      </View>

      <TimePickerModal
        visible={showTimePicker}
        time={wakeUpTime}
        label="Hora de despertar"
        onConfirm={(time) => {
          setWakeUpTime(time)
          setShowTimePicker(false)
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </View>
  )
}

export default OnboardingScreen
