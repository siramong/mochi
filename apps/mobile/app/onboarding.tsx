import "@/global.css";
import { useMemo, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}

export function OnboardingScreen() {
  const [fullName, setFullName] = useState('')
  const [wakeUpTime, setWakeUpTime] = useState('05:20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formIsValid = useMemo(() => {
    return fullName.trim().length > 1 && isValidTime(wakeUpTime)
  }, [fullName, wakeUpTime])

  async function handleConfirm() {
    const trimmedName = fullName.trim()

    if (trimmedName.length < 2) {
      setError('Escribe tu nombre completo para continuar')
      return
    }

    if (!isValidTime(wakeUpTime)) {
      setError('La hora debe tener formato HH:MM (ejemplo 05:20)')
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

      router.replace('/')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar tu perfil'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-purple-50 px-6 pt-16">
      <View className="rounded-3xl bg-pink-100 p-6 shadow-sm">
        <Text className="text-3xl font-bold text-purple-700">¡Bienvenida a Mochi!</Text>
        <Text className="mt-2 text-base text-purple-600">
          Cuéntanos un poquito de ti para preparar tu rutina adorable.
        </Text>
      </View>

      <View className="mt-6 rounded-3xl bg-blue-100 p-5 shadow-sm">
        <Text className="text-sm font-semibold text-purple-700">Tu nombre</Text>
        <TextInput
          className="mt-2 rounded-2xl bg-white px-4 py-3 text-base text-purple-900"
          placeholder="Ej: Camila Mochi"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
          maxLength={60}
        />

        <Text className="mt-4 text-sm font-semibold text-purple-700">Hora de despertar (HH:MM)</Text>
        <TextInput
          className="mt-2 rounded-2xl bg-white px-4 py-3 text-base text-purple-900"
          placeholder="05:20"
          value={wakeUpTime}
          onChangeText={setWakeUpTime}
          keyboardType="numbers-and-punctuation"
          editable={!loading}
          maxLength={5}
        />

        {error ? <Text className="mt-3 text-sm text-rose-600">{error}</Text> : null}

        <TouchableOpacity
          className="mt-5 items-center rounded-2xl bg-yellow-200 px-4 py-3 disabled:opacity-60"
          disabled={loading || !formIsValid}
          onPress={() => {
            void handleConfirm()
          }}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-base font-semibold text-purple-800">Confirmar</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-5 rounded-3xl bg-green-100 p-4">
        <Text className="text-center text-sm text-purple-700">
          Puedes cambiar estos datos luego desde tu perfil.
        </Text>
      </View>
    </View>
  )
}

export default OnboardingScreen
