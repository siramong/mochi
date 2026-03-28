import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { CycleLog } from '@/types/database'

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea' | 'unknown'

export type MochiCyclePersonality = {
  title: string
  recommendation: string
}

type CyclePhaseResult = {
  phase: CyclePhase
  dayOfCycle: number
  daysUntilNextPeriod: number
  personality: MochiCyclePersonality | null
}

const phasePersonality: Record<Exclude<CyclePhase, 'unknown'>, MochiCyclePersonality> = {
  menstrual: {
    title: 'Fase menstrual',
    recommendation: 'Prioriza descanso activo y tareas ligeras.',
  },
  folicular: {
    title: 'Fase folicular',
    recommendation: 'Buen momento para iniciar hábitos o temas nuevos.',
  },
  ovulatoria: {
    title: 'Fase ovulatoria',
    recommendation: 'Aprovecha la energía para actividades exigentes.',
  },
  lutea: {
    title: 'Fase lútea',
    recommendation: 'Enfócate en cierres y organización amable.',
  },
}

export function useCyclePhase(): CyclePhaseResult {
  const { session } = useSession()
  const userId = session?.user.id
  const [latestLog, setLatestLog] = useState<CycleLog | null>(null)

  useEffect(() => {
    if (!userId) return

    async function load() {
      const { data } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', userId)
        .order('period_start_date', { ascending: false })
        .limit(1)
        .maybeSingle<CycleLog>()

      setLatestLog(data ?? null)
    }

    void load()
  }, [userId])

  return useMemo(() => {
    if (!latestLog) {
      return { phase: 'unknown', dayOfCycle: 0, daysUntilNextPeriod: 0, personality: null }
    }

    const cycleLength = latestLog.cycle_length_days ?? 28
    const start = new Date(`${latestLog.period_start_date}T00:00:00`)
    const now = new Date()
    const dayOfCycle = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const normalizedDay = ((dayOfCycle - 1) % cycleLength) + 1

    let phase: CyclePhase = 'unknown'
    if (normalizedDay <= 5) phase = 'menstrual'
    else if (normalizedDay <= 13) phase = 'folicular'
    else if (normalizedDay <= 16) phase = 'ovulatoria'
    else phase = 'lutea'

    const personality = phasePersonality[phase]

    return {
      phase,
      dayOfCycle,
      daysUntilNextPeriod: Math.max(0, cycleLength - normalizedDay),
      personality,
    }
  }, [latestLog])
}
