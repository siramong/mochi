import { Ionicons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MochiCharacter } from '@/components/MochiCharacter'
import TimePickerModal from '@/components/TimePickerModal'
import { useCustomAlert } from '@/components/CustomAlert'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase'
import type { UserSettings } from '@/types/database'

type ProfileSettings = {
  full_name: string | null
  wake_up_time: string | null
}

type ModuleToggleKey =
  | 'study_enabled'
  | 'exercise_enabled'
  | 'habits_enabled'
  | 'goals_enabled'
  | 'mood_enabled'
  | 'gratitude_enabled'
  | 'vouchers_enabled'

type ModuleItem = {
  key: ModuleToggleKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

const moduleItems: ModuleItem[] = [
  { key: 'study_enabled', label: 'Estudio', icon: 'book-outline' },
  { key: 'exercise_enabled', label: 'Ejercicio', icon: 'barbell-outline' },
  { key: 'habits_enabled', label: 'Hábitos', icon: 'leaf-outline' },
  { key: 'goals_enabled', label: 'Metas', icon: 'flag-outline' },
  { key: 'mood_enabled', label: 'Estado de ánimo', icon: 'heart-outline' },
  { key: 'gratitude_enabled', label: 'Gratitud', icon: 'flower-outline' },
  { key: 'vouchers_enabled', label: 'Vales', icon: 'ticket-outline' },
]

const defaultModuleSettings: Pick<
  UserSettings,
  | 'study_enabled'
  | 'exercise_enabled'
  | 'habits_enabled'
  | 'goals_enabled'
  | 'mood_enabled'
  | 'gratitude_enabled'
  | 'vouchers_enabled'
> = {
  study_enabled: true,
  exercise_enabled: true,
  habits_enabled: true,
  goals_enabled: true,
  mood_enabled: true,
  gratitude_enabled: true,
  vouchers_enabled: true,
}

function isValidTime(value: string): boolean {
  const validPattern = /^([01]\d|2[0-3]):([0-5]\d)$/
  return validPattern.test(value)
}

export function SettingsScreen() {
  const { session } = useSession()
  const { showAlert, AlertComponent } = useCustomAlert()

  const [profile, setProfile] = useState<ProfileSettings>({
    full_name: '',
    wake_up_time: '',
  })
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [moduleSettings, setModuleSettings] = useState(defaultModuleSettings)

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userId = session?.user.id

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [profileRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, wake_up_time').eq('id', userId).single(),
        supabase
          .from('user_settings')
          .select(
            'study_enabled, exercise_enabled, habits_enabled, goals_enabled, mood_enabled, gratitude_enabled, vouchers_enabled'
          )
          .eq('user_id', userId)
          .maybeSingle(),
      ])

      if (profileRes.error) throw profileRes.error
      if (settingsRes.error) throw settingsRes.error

      setProfile((profileRes.data as ProfileSettings | null) ?? { full_name: '', wake_up_time: '' })
      setModuleSettings({
        ...defaultModuleSettings,
        ...((settingsRes.data as Partial<typeof defaultModuleSettings> | null) ?? {}),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los ajustes')
      setProfile({ full_name: '', wake_up_time: '' })
      setModuleSettings(defaultModuleSettings)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      void loadSettings()
    }, [loadSettings])
  )

  const handleSaveProfile = async () => {
    if (!userId) return

    const wakeUpTimeValue = (profile.wake_up_time ?? '').trim()
    if (!isValidTime(wakeUpTimeValue)) {
      showAlert({
        title: 'Hora inválida',
        message: 'La hora debe estar en formato HH:MM',
        buttons: [{ text: 'Entendido', style: 'cancel' }],
      })
      return
    }

    try {
      setSavingProfile(true)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: (profile.full_name ?? '').trim() || null,
          wake_up_time: wakeUpTimeValue,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      showAlert({
        title: 'Perfil actualizado',
        message: 'Tus datos se guardaron correctamente',
        buttons: [{ text: 'Aceptar', style: 'default' }],
      })
    } catch (err) {
      showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo actualizar el perfil',
        buttons: [{ text: 'Entendido', style: 'destructive' }],
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleToggleModule = async (key: ModuleToggleKey, value: boolean) => {
    if (!userId) return

    const previous = moduleSettings[key]
    setModuleSettings((prev) => ({ ...prev, [key]: value }))

    try {
      const payload = {
        user_id: userId,
        ...moduleSettings,
        [key]: value,
      }

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (upsertError) throw upsertError
    } catch (err) {
      setModuleSettings((prev) => ({ ...prev, [key]: previous }))
      showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo guardar el cambio',
        buttons: [{ text: 'Entendido', style: 'destructive' }],
      })
    }
  }

  const handleSignOut = () => {
    showAlert({
      title: 'Cerrar sesión',
      message: '¿Quieres cerrar tu sesión ahora?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            void supabase.auth.signOut()
          },
        },
      ],
    })
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-blue-50">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <TouchableOpacity className="mt-4 flex-row items-center" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#1d4ed8" />
            <Text className="ml-1 font-bold text-blue-900">Volver</Text>
          </TouchableOpacity>

          <View className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-4">
            <Text className="text-2xl font-extrabold text-blue-900">Ajustes</Text>
            <Text className="mt-2 text-sm font-semibold text-blue-700">
              Personaliza tu perfil y los módulos que quieres ver
            </Text>
          </View>

          {loading ? (
            <View className="mt-6 items-center rounded-3xl border-2 border-blue-200 bg-white p-6">
              <MochiCharacter mood="thinking" size={88} />
              <Text className="mt-3 text-sm font-semibold text-blue-800">Cargando ajustes...</Text>
            </View>
          ) : error ? (
            <View className="mt-6 items-center rounded-3xl border-2 border-red-200 bg-red-50 p-6">
              <MochiCharacter mood="sleepy" size={80} />
              <Text className="mt-3 text-center text-sm font-semibold text-red-700">{error}</Text>
              <TouchableOpacity
                className="mt-4 rounded-2xl bg-red-500 px-5 py-2"
                onPress={() => void loadSettings()}
              >
                <Text className="font-extrabold text-white">Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-4">
                <Text className="text-lg font-extrabold text-blue-900">Perfil</Text>

                <View className="mt-4">
                  <Text className="mb-2 text-sm font-bold text-blue-900">Nombre</Text>
                  <TextInput
                    className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-800"
                    placeholder="Tu nombre"
                    placeholderTextColor="#93c5fd"
                    value={profile.full_name ?? ''}
                    onChangeText={(value) => setProfile((prev) => ({ ...prev, full_name: value }))}
                  />
                </View>

                <View className="mt-4">
                  <Text className="mb-2 text-sm font-bold text-blue-900">Hora de despertar</Text>
                  <TouchableOpacity
                    className="rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3"
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text className="text-center text-lg font-extrabold text-blue-900">
                      {profile.wake_up_time || '06:00'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="mt-5 items-center rounded-2xl bg-blue-600 py-3"
                  onPress={() => void handleSaveProfile()}
                  disabled={savingProfile}
                >
                  <Text className="font-extrabold text-white">
                    {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TimePickerModal
                visible={showTimePicker}
                time={profile.wake_up_time ?? '06:00'}
                label="Hora de despertar"
                onConfirm={(time) => {
                  setProfile((prev) => ({ ...prev, wake_up_time: time }))
                  setShowTimePicker(false)
                }}
                onCancel={() => setShowTimePicker(false)}
              />

              <View className="mt-6 rounded-3xl border-2 border-blue-200 bg-white p-4">
                <Text className="text-lg font-extrabold text-blue-900">Módulos</Text>

                <View className="mt-4">
                  {moduleItems.map((module) => (
                    <View
                      key={module.key}
                      className="mb-3 flex-row items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name={module.icon} size={18} color="#1d4ed8" />
                        <Text className="ml-2 text-sm font-bold text-blue-900">{module.label}</Text>
                      </View>
                      <Switch
                        value={moduleSettings[module.key]}
                        onValueChange={(nextValue) => {
                          void handleToggleModule(module.key, nextValue)
                        }}
                        thumbColor={moduleSettings[module.key] ? '#1d4ed8' : '#94a3b8'}
                        trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
                      />
                    </View>
                  ))}
                </View>

                <View className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
                  <Text className="text-xs font-semibold text-blue-700">
                    Los módulos desactivados se ocultarán del perfil
                  </Text>
                </View>
              </View>

              <View className="mb-12 mt-6 rounded-3xl border-2 border-blue-200 bg-white p-4">
                <Text className="text-lg font-extrabold text-blue-900">Cuenta</Text>

                <TouchableOpacity
                  className="mt-4 items-center rounded-2xl bg-red-500 py-3"
                  onPress={handleSignOut}
                >
                  <Text className="font-extrabold text-white">Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      {AlertComponent}
    </>
  )
}

export default SettingsScreen
