import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const scheduleData = [
  { id: 1, subject: 'Math', time: '09:00', duration: '2h', color: 'bg-pink-200' },
  { id: 2, subject: 'English', time: '11:30', duration: '1h', color: 'bg-blue-200' },
  { id: 3, subject: 'Biology', time: '14:00', duration: '1.5h', color: 'bg-yellow-200' },
  { id: 4, subject: 'History', time: '16:00', duration: '1h', color: 'bg-teal-200' },
]

export function StudySchedule() {
  const [selectedDay, setSelectedDay] = useState('X')

  return (
    <View className="flex-1 bg-purple-100 px-5 pt-12">
      <View className="mb-6 flex-row items-center">
        <Ionicons name="calendar" size={20} />
        <Text className="ml-2 text-2xl font-extrabold text-purple-900">Study Schedule</Text>
      </View>

      <View className="mb-4 flex-row justify-between rounded-3xl border-2 border-purple-200 bg-white p-2">
        {days.map((day) => {
          const active = day === selectedDay

          return (
            <TouchableOpacity
              key={day}
              className={`h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-purple-500' : ''}`}
              onPress={() => {
                setSelectedDay(day)
              }}
            >
              <Text className={`font-extrabold ${active ? 'text-white' : 'text-purple-500'}`}>{day}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl border-2 border-purple-200 bg-white p-4">
          {scheduleData.map((item) => (
            <View
              key={item.id}
              className={`mb-3 rounded-2xl border border-slate-100 p-4 ${item.color}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-slate-800">{item.subject}</Text>
                <Text className="text-xs font-bold text-slate-600">{item.duration}</Text>
              </View>
              <Text className="mt-1 text-sm font-semibold text-slate-700">{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity className="absolute bottom-28 right-6 h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-purple-500">
        <Ionicons name="add" size={26} />
      </TouchableOpacity>
    </View>
  )
}

export default StudySchedule