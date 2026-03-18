import { Ionicons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'

type HomeDashboardProps = {
  userName: string
  email: string | undefined
  onSignOut: () => void
}

const studyBlocks = [
  { id: 1, subject: 'Math', time: '09:00 - 10:30', duration: '1.5h', color: 'bg-pink-200' },
  { id: 2, subject: 'English', time: '11:00 - 12:00', duration: '1h', color: 'bg-blue-200' },
  { id: 3, subject: 'Biology', time: '14:00 - 15:30', duration: '1.5h', color: 'bg-yellow-200' },
]

export function HomeDashboard({ userName, email, onSignOut }: HomeDashboardProps) {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  return (
    <View className="flex-1 bg-blue-100 px-5 pt-12">
      <Text className="text-3xl font-extrabold text-blue-900">Hola, {userName}</Text>
      <Text className="mt-1 text-sm font-semibold capitalize text-blue-700">{today}</Text>

      <View className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-5">
        <View className="mb-3 flex-row items-center">
          <Ionicons name="book" size={18} />
          <Text className="ml-2 text-base font-bold text-blue-900">Bloques de estudio</Text>
        </View>

        {studyBlocks.map((block) => (
          <View
            key={block.id}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
          >
            <View className="flex-row items-center">
              <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${block.color}`}>
                <Text className="text-xs font-extrabold text-slate-700">{block.subject[0]}</Text>
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-800">{block.subject}</Text>
                <Text className="text-xs font-semibold text-slate-500">{block.time}</Text>
              </View>
            </View>
            <View className="rounded-full bg-white px-3 py-1">
              <Text className="text-xs font-bold text-slate-600">{block.duration}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-4 rounded-3xl border-2 border-teal-200 bg-white p-5">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="barbell" size={18} />
          <Text className="ml-2 text-base font-bold text-blue-900">Rutina de hoy</Text>
        </View>
        <Text className="text-sm font-bold text-slate-800">Morning Stretch</Text>
        <Text className="mt-1 text-xs font-semibold text-teal-700">5 ejercicios • 15 min</Text>
        <TouchableOpacity className="mt-3 items-center rounded-2xl border border-teal-200 bg-teal-100 py-3">
          <Text className="font-bold text-teal-800">Iniciar rutina</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 rounded-3xl border border-purple-100 bg-white p-4">
        <Text className="text-xs font-semibold text-purple-800">Sesión activa: {email ?? 'sin correo'}</Text>
        <TouchableOpacity
          className="mt-3 items-center rounded-2xl bg-purple-200 py-3"
          onPress={onSignOut}
        >
          <Text className="font-bold text-purple-900">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default HomeDashboard