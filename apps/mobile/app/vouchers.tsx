import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MochiCharacter } from '@/components/MochiCharacter'
import { useCustomAlert } from '@/components/CustomAlert'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase'
import type { Voucher, VoucherTemplate } from '@/types/database'

type ProfilePoints = {
  total_points: number
}

type VoucherStatus = {
  label: string
  className: string
  textClass: string
}

const templateCardClassMap: Record<string, string> = {
  pink: 'border-pink-200 bg-pink-100',
  purple: 'border-purple-200 bg-purple-100',
  yellow: 'border-yellow-200 bg-yellow-100',
  blue: 'border-blue-200 bg-blue-100',
  mint: 'border-emerald-200 bg-emerald-100',
  green: 'border-green-200 bg-green-100',
  orange: 'border-orange-200 bg-orange-100',
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(value))
    .replace('.', '')
}

function getStatus(isRedeemed: boolean): VoucherStatus {
  if (isRedeemed) {
    return {
      label: 'Canjeado',
      className: 'bg-emerald-100',
      textClass: 'text-emerald-800',
    }
  }

  return {
    label: 'Pendiente',
    className: 'bg-yellow-100',
    textClass: 'text-yellow-900',
  }
}

function resolveTemplateClass(color: string): string {
  return templateCardClassMap[color] ?? 'border-purple-200 bg-purple-100'
}

export function VouchersScreen() {
  const { session } = useSession()
  const { showAlert, AlertComponent } = useCustomAlert()
  const [templates, setTemplates] = useState<VoucherTemplate[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  const userId = session?.user.id

  const loadVouchersData = useCallback(async () => {
    if (!userId) {
      setTemplates([])
      setVouchers([])
      setTotalPoints(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [templatesRes, vouchersRes, profileRes] = await Promise.all([
        supabase
          .from('voucher_templates')
          .select('id, title, description, points_cost, icon, color, created_at')
          .order('points_cost', { ascending: true }),
        supabase
          .from('vouchers')
          .select(
            'id, user_id, template_id, title, description, points_cost, icon, color, is_redeemed, redeemed_at, created_at'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('total_points').eq('id', userId).single(),
      ])

      if (templatesRes.error) throw templatesRes.error
      if (vouchersRes.error) throw vouchersRes.error
      if (profileRes.error) throw profileRes.error

      setTemplates((templatesRes.data ?? []) as VoucherTemplate[])
      setVouchers((vouchersRes.data ?? []) as Voucher[])
      setTotalPoints(((profileRes.data as ProfilePoints | null)?.total_points ?? 0) as number)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los vales')
      setTemplates([])
      setVouchers([])
      setTotalPoints(0)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      void loadVouchersData()
    }, [loadVouchersData])
  )

  const hasGeneratedVouchers = useMemo(() => vouchers.length > 0, [vouchers.length])

  const handleGenerateVoucher = async (template: VoucherTemplate) => {
    if (!userId) return

    if (totalPoints < template.points_cost) {
      showAlert({
        title: 'Puntos insuficientes',
        message: 'No tienes suficientes puntos',
        buttons: [{ text: 'Entendido', style: 'cancel' }],
      })
      return
    }

    try {
      setGeneratingId(template.id)

      const nextPoints = totalPoints - template.points_cost

      const { error: updatePointsError } = await supabase
        .from('profiles')
        .update({ total_points: nextPoints })
        .eq('id', userId)

      if (updatePointsError) throw updatePointsError

      const { error: createVoucherError } = await supabase.from('vouchers').insert({
        user_id: userId,
        template_id: template.id,
        title: template.title,
        description: template.description,
        points_cost: template.points_cost,
        icon: template.icon,
        color: template.color,
        is_redeemed: false,
      })

      if (createVoucherError) throw createVoucherError

      setTotalPoints(nextPoints)

      showAlert({
        title: 'Vale generado',
        message: 'Tu vale está listo para compartir con tu pareja',
        buttons: [{ text: 'Perfecto', style: 'default' }],
      })

      await loadVouchersData()
    } catch (err) {
      showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudo generar el vale',
        buttons: [{ text: 'Entendido', style: 'destructive' }],
      })
    } finally {
      setGeneratingId(null)
    }
  }

  const handleMarkAsRedeemed = (voucher: Voucher) => {
    if (voucher.is_redeemed) {
      showAlert({
        title: 'Vale canjeado',
        message: 'Este vale ya fue canjeado',
        buttons: [{ text: 'Aceptar', style: 'cancel' }],
      })
      return
    }

    showAlert({
      title: 'Canjear vale',
      message: '¿Quieres marcar este vale como canjeado?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como canjeado',
          style: 'default',
          onPress: () => {
            void (async () => {
              try {
                setRedeemingId(voucher.id)

                const { error: updateError } = await supabase
                  .from('vouchers')
                  .update({
                    is_redeemed: true,
                    redeemed_at: new Date().toISOString(),
                  })
                  .eq('id', voucher.id)
                  .eq('user_id', voucher.user_id)

                if (updateError) throw updateError
                await loadVouchersData()
              } catch (err) {
                showAlert({
                  title: 'Error',
                  message: err instanceof Error ? err.message : 'No se pudo actualizar el vale',
                  buttons: [{ text: 'Entendido', style: 'destructive' }],
                })
              } finally {
                setRedeemingId(null)
              }
            })()
          },
        },
      ],
    })
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-yellow-50">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <TouchableOpacity className="mt-4 flex-row items-center" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#92400e" />
            <Text className="ml-1 font-bold text-yellow-900">Volver</Text>
          </TouchableOpacity>

          <View className="mt-6 rounded-3xl border-2 border-yellow-200 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-extrabold text-yellow-900">Vales</Text>
              <View className="rounded-full bg-yellow-200 px-3 py-1">
                <Text className="text-xs font-extrabold text-yellow-900">{totalPoints} puntos</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm font-semibold text-yellow-700">
              Canjea tus puntos por recompensas especiales
            </Text>
          </View>

          {loading ? (
            <View className="mt-6 items-center rounded-3xl border-2 border-yellow-200 bg-white p-6">
              <MochiCharacter mood="thinking" size={88} />
              <Text className="mt-3 text-sm font-semibold text-yellow-800">Cargando vales...</Text>
            </View>
          ) : error ? (
            <View className="mt-6 items-center rounded-3xl border-2 border-red-200 bg-red-50 p-6">
              <MochiCharacter mood="sleepy" size={76} />
              <Text className="mt-3 text-center text-sm font-semibold text-red-700">{error}</Text>
              <TouchableOpacity
                className="mt-4 rounded-2xl bg-red-500 px-5 py-2"
                onPress={() => void loadVouchersData()}
              >
                <Text className="font-extrabold text-white">Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="mt-6">
                <Text className="text-lg font-extrabold text-yellow-900">Mis vales</Text>

                {!hasGeneratedVouchers ? (
                  <View className="mt-3 items-center rounded-3xl border-2 border-yellow-200 bg-white p-6">
                    <MochiCharacter mood="happy" size={86} />
                    <Text className="mt-3 text-center text-sm font-semibold text-yellow-800">
                      Acumula puntos para generar vales
                    </Text>
                  </View>
                ) : (
                  <View className="mt-3">
                    {vouchers.map((voucher) => {
                      const status = getStatus(voucher.is_redeemed)

                      return (
                        <TouchableOpacity
                          key={voucher.id}
                          className="mb-3 rounded-2xl border-2 border-yellow-200 bg-white p-4"
                          onLongPress={() => handleMarkAsRedeemed(voucher)}
                          delayLongPress={250}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <View className="h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                                <Ionicons
                                  name={(voucher.icon as keyof typeof Ionicons.glyphMap) || 'ticket-outline'}
                                  size={18}
                                  color="#92400e"
                                />
                              </View>
                              <View className="ml-3">
                                <Text className="text-base font-extrabold text-yellow-950">{voucher.title}</Text>
                                <Text className="mt-1 text-xs font-semibold text-yellow-800">
                                  {formatDate(voucher.created_at)}
                                </Text>
                              </View>
                            </View>
                            <View className={`rounded-full px-3 py-1 ${status.className}`}>
                              <Text className={`text-xs font-extrabold ${status.textClass}`}>{status.label}</Text>
                            </View>
                          </View>

                          {redeemingId === voucher.id && (
                            <Text className="mt-3 text-xs font-semibold text-yellow-800">
                              Actualizando estado...
                            </Text>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>

              <View className="mt-6">
                <Text className="text-lg font-extrabold text-yellow-900">Catálogo</Text>

                {templates.length === 0 ? (
                  <View className="mt-3 items-center rounded-3xl border-2 border-yellow-200 bg-white p-6">
                    <MochiCharacter mood="happy" size={82} />
                    <Text className="mt-3 text-center text-sm font-semibold text-yellow-800">
                      Aún no hay plantillas disponibles
                    </Text>
                  </View>
                ) : (
                  <View className="mt-3">
                    {templates.map((template) => (
                      <View
                        key={template.id}
                        className={`mb-3 rounded-2xl border-2 p-4 ${resolveTemplateClass(template.color)}`}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <View className="flex-row items-center">
                              <Ionicons
                                name={(template.icon as keyof typeof Ionicons.glyphMap) || 'gift-outline'}
                                size={16}
                                color="#7c3aed"
                              />
                              <Text className="ml-2 text-base font-extrabold text-slate-900">
                                {template.title}
                              </Text>
                            </View>
                            <Text className="mt-2 text-sm font-semibold text-slate-700">
                              {template.description}
                            </Text>
                            <Text className="mt-2 text-xs font-extrabold text-slate-600">
                              {template.points_cost} puntos
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          className="mt-4 items-center rounded-2xl bg-yellow-500 py-3"
                          onPress={() => void handleGenerateVoucher(template)}
                          disabled={generatingId === template.id}
                        >
                          <Text className="font-extrabold text-white">
                            {generatingId === template.id ? 'Generando...' : 'Generar vale'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          <View className="h-14" />
        </ScrollView>
      </SafeAreaView>
      {AlertComponent}
    </>
  )
}

export default VouchersScreen
