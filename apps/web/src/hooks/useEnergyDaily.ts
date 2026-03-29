import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { EnergyLevel } from '@/types/database'

type EnergyTrend = 'up' | 'down' | 'stable'

interface EnergyDailyState {
  todayEnergy: number | null
  trend: EnergyTrend
  isLoading: boolean
  error: Error | null
}

export function useEnergyDaily(): EnergyDailyState {
  const { session } = useSession()
  const userId = session?.user.id

  const { data, isLoading, error } = useQuery({
    queryKey: ['energyDaily', userId],
    queryFn: async () => {
      if (!userId) return { currentEnergy: null, trend: 'stable' as const }

      try {
        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Fetch today's energy level
        const { data: todayData, error: todayError } = await supabase
          .from('energy_levels')
          .select('*')
          .eq('user_id', userId)
          .eq('logged_date', today)
          .maybeSingle()

        if (todayError && todayError.code !== 'PGRST116') {
          throw todayError
        }

        const currentEnergy = (todayData as EnergyLevel | null)?.overall_rating ?? null

        // Calculate trend from last 3 days
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 3)
        const pastDateStr = pastDate.toISOString().split('T')[0]

        const { data: pastData, error: pastError } = await supabase
          .from('energy_levels')
          .select('overall_rating')
          .eq('user_id', userId)
          .gte('logged_date', pastDateStr)
          .lt('logged_date', today)
          .order('logged_date', { ascending: true })

        if (pastError && pastError.code !== 'PGRST116') {
          throw pastError
        }

        // Calculate trend
        let trend: EnergyTrend = 'stable'
        if (pastData && pastData.length > 0 && currentEnergy !== null) {
          const pastValues = (pastData as Pick<EnergyLevel, 'overall_rating'>[]).map(
            (d) => d.overall_rating
          )
          const avgPast = pastValues.reduce((a, b) => a + b, 0) / pastValues.length
          const diff = currentEnergy - avgPast

          if (diff > 1) {
            trend = 'up'
          } else if (diff < -1) {
            trend = 'down'
          }
        }

        return { currentEnergy, trend }
      } catch (err) {
        console.error('useEnergyDaily error:', err)
        throw err
      }
    },
    enabled: !!userId,
  })

  return {
    todayEnergy: data?.currentEnergy ?? null,
    trend: (data?.trend ?? 'stable') as EnergyTrend,
    isLoading,
    error: error instanceof Error ? error : null,
  }
}
