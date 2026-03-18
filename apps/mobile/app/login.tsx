import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Error', error.message)
    setLoading(false)
  }

  async function signUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) Alert.alert('Error', error.message)
    else Alert.alert('Revisa tu correo para confirmar tu cuenta')
    setLoading(false)
  }

  return (
    <View className="flex-1 items-center justify-center p-8 bg-white">
      <Text className="text-2xl font-bold mb-8">Bienvenido</Text>
      <TextInput
        className="w-full border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="w-full border border-gray-300 rounded-lg p-3 mb-6"
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="w-full bg-black rounded-lg p-3 items-center mb-3"
        onPress={signIn}
        disabled={loading}
      >
        <Text className="text-white font-medium">Iniciar sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-full border border-black rounded-lg p-3 items-center"
        onPress={signUp}
        disabled={loading}
      >
        <Text className="font-medium">Registrarse</Text>
      </TouchableOpacity>
    </View>
  )
}