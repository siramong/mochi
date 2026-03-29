import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { StreakRecoveryPlan } from '@mochi/supabase/types'

export function useStreakRecovery() {
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<StreakRecoveryPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setIsLoading(true)
        const user = await supabase.auth.getUser()
        const userId = user.data?.user?.id

        if (!userId) {
          setActiveRecoveryPlan(null)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('streak_recovery_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError
        }

        setActiveRecoveryPlan((data as StreakRecoveryPlan | null) ?? null)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error fetching recovery plan')
        setError(error)
        console.error('useStreakRecovery error:', err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const createRecoveryPlan = async (userId: string): Promise<StreakRecoveryPlan | null> => {
    try {
      const recoveryTasks = [
        { day: 1, description: 'Haz una pequeña actividad: 15 min de estudio o una rutina corta', difficulty: 'easy' as const },
        { day: 2, description: 'Completa una meta diaria: 30 min de estudio o una rutina completa', difficulty: 'medium' as const },
        { day: 3, description: 'Vuelve a tu rutina normal con toda la energía', difficulty: 'hard' as const },
      ]

      const { data, error } = await supabase
        .from('streak_recovery_plans')
        .insert({
          user_id: userId,
          recovery_tasks: recoveryTasks,
          is_active: true,
          completed_tasks: 0,
        })
        .select()
        .single()

      if (error) throw error

      const newPlan = data as StreakRecoveryPlan
      setActiveRecoveryPlan(newPlan)
      return newPlan
    } catch (err) {
      console.error('Error creating recovery plan:', err)
      throw err
    }
  }

  const completeRecoveryTask = async (planId: string): Promise<void> => {
    try {
      if (!activeRecoveryPlan) throw new Error('No active recovery plan')

      const newCompletedTasks = activeRecoveryPlan.completed_tasks + 1
      const isComplete = newCompletedTasks >= activeRecoveryPlan.recovery_tasks.length

      const { error } = await supabase
        .from('streak_recovery_plans')
        .update({
          completed_tasks: newCompletedTasks,
          is_active: !isComplete,
        })
        .eq('id', planId)

      if (error) throw error

      setActiveRecoveryPlan(
        isComplete
          ? null
          : { ...activeRecoveryPlan, completed_tasks: newCompletedTasks }
      )
    } catch (err) {
      console.error('Error completing recovery task:', err)
      throw err
    }
  }

  const dismissRecoveryPlan = async (planId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('streak_recovery_plans')
        .update({ is_active: false })
        .eq('id', planId)

      if (error) throw error
      setActiveRecoveryPlan(null)
    } catch (err) {
      console.error('Error dismissing recovery plan:', err)
      throw err
    }
  }

  return {
    activeRecoveryPlan,
    isLoading,
    error,
    createRecoveryPlan,
    completeRecoveryTask,
    dismissRecoveryPlan,
  }
}

