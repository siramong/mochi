import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { MoodLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function MoodPage() {
  const { session } = useSession()
  const [items, setItems] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadMood() {
      const { data } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_date', { ascending: false })
        .returns<MoodLog[]>()

      setItems(data ?? [])
      setLoading(false)
    }

    void loadMood()
  }, [session?.user.id])

  if (loading) return <p className="text-sm text-purple-700">Cargando estado de ánimo...</p>

  if (items.length === 0) {
    return <EmptyState title="Sin registros de ánimo" description="Tus registros diarios aparecerán aquí en formato histórico." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Estado de ánimo</h1>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <p className="font-bold text-rose-900">Nivel: {item.mood}/5</p>
            <p className="text-xs text-rose-700">Fecha: {item.logged_date}</p>
            {item.note ? <p className="mt-1 text-sm text-rose-900">{item.note}</p> : null}
          </article>
        ))}
      </div>
    </div>
  )
}
