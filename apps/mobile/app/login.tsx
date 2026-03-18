import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '@/lib/supabase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  async function signUp() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      setError('Revisa tu correo para confirmar tu cuenta')
    }

    setLoading(false)
  }

  return (
    <View className="flex-1 bg-purple-50 px-6 pt-16">
      <View className="rounded-3xl bg-yellow-100 p-6 shadow-sm">
        <Text className="text-3xl font-bold text-purple-700">Mochi</Text>
        <Text className="mt-2 text-base text-purple-600">
          Tu espacio adorable para estudio, ejercicio y rutina diaria.
        </Text>
      </View>

      <View className="mt-6 rounded-3xl bg-pink-100 p-5 shadow-sm">
        <Text className="text-sm font-semibold text-purple-700">Correo</Text>
        <TextInput
          className="mt-2 rounded-2xl bg-white px-4 py-3 text-base text-purple-900"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Text className="mt-4 text-sm font-semibold text-purple-700">Contraseña</Text>
        <TextInput
          className="mt-2 rounded-2xl bg-white px-4 py-3 text-base text-purple-900"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {error ? <Text className="mt-3 text-sm text-purple-700">{error}</Text> : null}

        <TouchableOpacity
          className="mt-5 items-center rounded-2xl bg-blue-100 px-4 py-3 disabled:opacity-60"
          onPress={() => {
            void signIn()
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text className="text-base font-semibold text-purple-800">Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-3 items-center rounded-2xl bg-green-100 px-4 py-3 disabled:opacity-60"
          onPress={() => {
            void signUp()
          }}
          disabled={loading}
        >
          <Text className="text-base font-semibold text-purple-800">Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default LoginScreen