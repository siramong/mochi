export * from '@mochi/supabase/types'

// ─── Planner Types ────────────────────────────────────────────────────────
export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal'

export interface MergedTask {
	id: string
	type: 'study' | 'routine' | 'goal' | 'habit'
	title: string
	description?: string
}

export interface TaskScore {
	id: string
	type: 'study' | 'routine' | 'goal' | 'habit'
	title: string
	score: number
	reason: string
	recommendedLevel: 'light' | 'medium' | 'intense'
}
