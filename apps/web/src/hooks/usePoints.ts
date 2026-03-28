import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePoints(userId: string | undefined) {
  const [points, setPoints] = useState(0)

  const refreshPoints = useCallback(async () => {
    if (!userId) {
      setPoints(0)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .maybeSingle<{ total_points: number }>()

    if (!error && data) {
      setPoints(data.total_points ?? 0)
    }
  }, [userId])

  useEffect(() => {
    void refreshPoints()
  }, [refreshPoints])

  useEffect(() => {
    if (!userId) return

    const onPointsUpdated = () => {
      void refreshPoints()
    }

    window.addEventListener('mochi:points-updated', onPointsUpdated)
    const interval = window.setInterval(() => {
      void refreshPoints()
    }, 30000)

    return () => {
      window.removeEventListener('mochi:points-updated', onPointsUpdated)
      window.clearInterval(interval)
    }
  }, [refreshPoints, userId])

  return { points, refreshPoints }
}
