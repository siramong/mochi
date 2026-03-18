import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const routines = [
  {
    id: 1,
    name: 'Morning Stretch',
    exercises: 5,
    time: '15 min',
    days: ['L', 'X', 'V'],
    color: 'bg-teal-200',
  },
  {
    id: 2,
    name: 'Quick Cardio',
    exercises: 8,
    time: '20 min',
    days: ['M', 'J'],
    color: 'bg-pink-200',
  },
  {
    id: 3,
    name: 'Evening Yoga',
    exercises: 6,
    time: '30 min',
    days: ['D'],
    color: 'bg-purple-200',
  },
]

export function ExerciseRoutine() {
  return (
    <View className="flex-1 bg-teal-100 px-5 pt-12">
      <View className="mb-6 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl border-2 border-teal-200 bg-white">
          <Ionicons name="barbell" size={20} />
        </View>
        <Text className="ml-3 text-2xl font-extrabold text-teal-900">Exercise Routines</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {routines.map((routine) => (
          <View key={routine.id} className="mb-4 rounded-3xl border-2 border-teal-200 bg-white p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-extrabold text-slate-800">{routine.name}</Text>
                <View className="mt-2 flex-row">
                  {routine.days.map((day) => (
                    <View key={`${routine.id}-${day}`} className={`mr-2 rounded-full px-2 py-1 ${routine.color}`}>
                      <Text className="text-xs font-bold text-slate-700">{day}</Text>
                    </View>
                  ))}
                </View>
                <Text className="mt-2 text-sm font-semibold text-slate-600">
                  {routine.exercises} ejercicios • {routine.time}
                </Text>
              </View>

              <TouchableOpacity className={`h-11 w-11 items-center justify-center rounded-2xl ${routine.color}`}>
                <Ionicons name="play" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity className="mb-6 mt-4 flex-row items-center justify-center rounded-2xl bg-teal-500 py-4">
        <Ionicons name="add" size={20} />
        <Text className="ml-2 text-base font-extrabold text-white">Add New Routine</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ExerciseRoutine