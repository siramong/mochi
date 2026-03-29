import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Voucher } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function VouchersPage() {
  const { session } = useSession()
  const [items, setItems] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }

    let isActive = true

    async function loadVouchers() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: vouchersError } = await supabase
          .from('vouchers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .returns<Voucher[]>()

        if (!isActive) {
          return
        }

        if (vouchersError) {
          setError(vouchersError.message)
          setItems([])
          return
        }

        setItems(data ?? [])
      } catch (loadError) {
        if (!isActive) {
          return
        }
        console.error('Error inesperado cargando vales:', loadError)
        setError('No se pudieron cargar los vales')
        setItems([])
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadVouchers()

    return () => {
      isActive = false
    }
  }, [session?.user.id])

  if (loading) return <p className="text-sm text-purple-700">Cargando vales...</p>

  if (error) return <p className="text-sm text-red-600">{error}</p>

  if (items.length === 0) {
    return <EmptyState title="No tienes vales todavía" description="Tus recompensas creadas aparecerán aquí para seguimiento." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Vales y recompensas</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="font-bold text-yellow-950">{item.title}</p>
            <p className="mt-1 text-sm text-yellow-900">{item.description}</p>
            <p className="mt-2 text-xs font-semibold text-yellow-800">Costo: {item.points_cost} puntos</p>
            <span
              className={[
                'mt-3 inline-flex rounded-full px-2 py-1 text-xs font-bold',
                item.is_redeemed
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-orange-100 text-orange-800',
              ].join(' ')}
            >
              {item.is_redeemed ? 'Canjeado' : 'Disponible'}
            </span>
          </article>
        ))}
      </div>
    </div>
  )
}
