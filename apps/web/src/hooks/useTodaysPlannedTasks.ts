import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type {
  StudyBlock,
  Routine,
  Goal,
  Habit,
  MergedTask,
} from '@/types/database'

export function useTodaysPlannedTasks() {
  const { session } = useSession()
  const userId = session?.user.id

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['todaysPlannedTasks', userId],
    queryFn: async () => {
      if (!userId) return []

      try {
        // Get today's day of week (0 = Sunday, 6 = Saturday)
        const today = new Date().getDay()

        // Fetch study blocks for today
        const { data: studyBlocks, error: studyError } = await supabase
          .from('study_blocks')
          .select('*')
          .eq('user_id', userId)
          .eq('day_of_week', today)

        if (studyError && studyError.code !== 'PGRST116') {
          throw studyError
        }

        // Fetch routines for today
        const { data: routines, error: routinesError } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', userId)

        if (routinesError && routinesError.code !== 'PGRST116') {
          throw routinesError
        }

        // Filter routines by today's day of week
        const todaysRoutines = (routines as Routine[] | null)?.filter((r) =>
          r.days.includes(today)
        ) ?? []

        // Fetch goals
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)

        if (goalsError && goalsError.code !== 'PGRST116') {
          throw goalsError
        }

        // Fetch habits for today
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)

        if (habitsError && habitsError.code !== 'PGRST116') {
          throw habitsError
        }

        // Merge all tasks
        const mergedTasks: MergedTask[] = [
          ...((studyBlocks as StudyBlock[] | null)?.map((sb) => ({
            id: sb.id,
            type: 'study' as const,
            title: sb.subject,
            description: `${sb.start_time} - ${sb.end_time}`,
          })) ?? []),
          ...todaysRoutines.map((r) => ({
            id: r.id,
            type: 'routine' as const,
            title: r.name,
          })),
          ...((goals as Goal[] | null)?.map((g) => ({
            id: g.id,
            type: 'goal' as const,
            title: g.title,
            description: g.description ?? undefined,
          })) ?? []),
          ...((habits as Habit[] | null)?.map((h) => ({
            id: h.id,
            type: 'habit' as const,
            title: h.name,
          })) ?? []),
        ]

        return mergedTasks
      } catch (err) {
        console.error('useTodaysPlannedTasks error:', err)
        throw err
      }
    },
    enabled: !!userId,
  })

  return {
    tasks,
    isLoading,
    error: error instanceof Error ? error : null,
  }
}
