import { View, Text, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

export function HomeScreen() {
  const { session } = useSession()

  return (
    <View className="flex-1 bg-blue-50 px-6 pt-16">
      <View className="rounded-3xl bg-purple-100 p-6 shadow-sm">
        <Text className="text-3xl font-bold text-purple-800">Hola, Mochi</Text>
        <Text className="mt-2 text-base text-purple-700">
          Tu día de enfoque y energía empieza aquí.
        </Text>
      </View>

      <View className="mt-6 rounded-3xl bg-pink-100 p-5 shadow-sm">
        <Text className="text-sm font-semibold text-purple-700">Sesión activa</Text>
        <Text className="mt-2 text-base text-purple-800">{session?.user.email}</Text>
      </View>

      <View className="mt-5 rounded-3xl bg-yellow-100 p-5 shadow-sm">
        <Text className="text-sm text-purple-700">
          Pronto verás aquí tus bloques de estudio, rutinas y progreso diario.
        </Text>
      </View>

      <TouchableOpacity
        className="mt-6 items-center rounded-2xl bg-green-100 px-4 py-3"
        onPress={() => {
          void supabase.auth.signOut()
        }}
      >
        <Text className="text-base font-semibold text-purple-800">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

export default HomeScreen