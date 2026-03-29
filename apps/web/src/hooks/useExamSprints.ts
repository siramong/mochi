import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { ExamPrepSprint, ExamSprintMilestone } from '@/types/database'

interface SprintWithMilestones extends ExamPrepSprint {
  milestones: ExamSprintMilestone[]
}

export function useExamSprints() {
  const { session } = useSession()
  const userId = session?.user.id
  const queryClient = useQueryClient()

  const { data: sprints = [], isLoading, error } = useQuery({
    queryKey: ['examSprints', userId],
    queryFn: async () => {
      if (!userId) return []

      try {
        const { data: sprintsData, error: sprintsError } = await supabase
          .from('exam_prep_sprints')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (sprintsError && sprintsError.code !== 'PGRST116') {
          throw sprintsError
        }

        if (!sprintsData) return []

        // Fetch milestones for each sprint
        const sprintsWithMilestones: SprintWithMilestones[] = await Promise.all(
          (sprintsData as ExamPrepSprint[]).map(async (sprint) => {
            const { data: milestonesData, error: milestonesError } = await supabase
              .from('exam_sprint_milestones')
              .select('*')
              .eq('sprint_id', sprint.id)
              .order('milestone_number', { ascending: true })

            if (milestonesError && milestonesError.code !== 'PGRST116') {
              throw milestonesError
            }

            return {
              ...sprint,
              milestones: (milestonesData as ExamSprintMilestone[]) ?? [],
            }
          })
        )

        return sprintsWithMilestones
      } catch (err) {
        console.error('useExamSprints error:', err)
        throw err
      }
    },
    enabled: !!userId,
  })

  const createSprintMutation = useMutation({
    mutationFn: async (payload: {
      exam_id: string
      start_date: string
      end_date: string
      daily_target_hours: number
      target_grade?: number | null
    }) => {
      if (!userId) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('exam_prep_sprints')
        .insert({
          user_id: userId,
          ...payload,
        })
        .select()
        .single()

      if (error) throw error
      return data as ExamPrepSprint
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examSprints', userId] })
    },
  })

  return {
    sprints,
    isLoading,
    error: error instanceof Error ? error : null,
    createSprint: createSprintMutation.mutateAsync,
  }
}
