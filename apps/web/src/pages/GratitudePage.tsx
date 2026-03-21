import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { GratitudeLog } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function GratitudePage() {
  const { session } = useSession()
  const [items, setItems] = useState<GratitudeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadGratitude() {
      const { data } = await supabase
        .from('gratitude_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_date', { ascending: false })
        .returns<GratitudeLog[]>()

      setItems(data ?? [])
      setLoading(false)
    }

    void loadGratitude()
  }, [session?.user.id])

  if (loading) return <p className="text-sm text-purple-700">Cargando gratitud...</p>

  if (items.length === 0) {
    return <EmptyState title="Sin entradas de gratitud" description="Empieza tu diario de gratitud y revísalo desde web." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Diario de gratitud</h1>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700">{item.logged_date}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-950">
              <li>{item.entry_1}</li>
              {item.entry_2 ? <li>{item.entry_2}</li> : null}
              {item.entry_3 ? <li>{item.entry_3}</li> : null}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
