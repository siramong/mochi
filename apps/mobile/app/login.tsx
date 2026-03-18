import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
    <View className="flex-1 items-center justify-center bg-purple-100 px-6">
      <View className="absolute left-10 top-20 h-12 w-12 items-center justify-center rounded-2xl bg-purple-200">
        <Ionicons name="sparkles" size={22} />
      </View>

      <View className="absolute bottom-32 right-10 h-12 w-12 items-center justify-center rounded-2xl bg-pink-200">
        <Ionicons name="heart" size={22} />
      </View>

      <View className="w-full max-w-sm">
        <View className="items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border-2 border-purple-200 bg-white">
            <Ionicons name="planet" size={36} />
          </View>
          <Text className="text-5xl font-extrabold text-purple-800">Mochi</Text>
          <Text className="mt-2 text-lg font-semibold text-purple-700">Tu cute study buddy</Text>
        </View>

        <View className="mt-8">
          <TextInput
            className="rounded-3xl border-2 border-purple-200 bg-white px-5 py-4 text-base text-purple-900"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            className="mt-4 rounded-3xl border-2 border-purple-200 bg-white px-5 py-4 text-base text-purple-900"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text className="mt-3 text-sm text-purple-900">{error}</Text> : null}

          <TouchableOpacity
            className="mt-5 items-center rounded-3xl bg-purple-600 px-4 py-4 disabled:opacity-60"
            onPress={() => {
              void signIn()
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-lg font-extrabold text-white">Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 items-center rounded-3xl border-2 border-purple-200 bg-white px-4 py-4 disabled:opacity-60"
            onPress={() => {
              void signUp()
            }}
            disabled={loading}
          >
            <Text className="text-lg font-extrabold text-purple-700">Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default LoginScreen