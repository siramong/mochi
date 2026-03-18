import { View, Text, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

export default function Index() {
  const { session } = useSession()

  return (
    <View className="flex-1 items-center justify-center p-8 bg-white">
      <Text className="text-2xl font-bold mb-2">Hola 👋</Text>
      <Text className="text-muted-foreground mb-8">{session?.user.email}</Text>
      <TouchableOpacity
        className="border border-black rounded-lg p-3 px-6"
        onPress={() => supabase.auth.signOut()}
      >
        <Text className="font-medium">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}