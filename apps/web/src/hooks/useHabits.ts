import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Habit, HabitLog } from '@mochi/supabase/types'

export function useHabits(userId: string | undefined) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHabits = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setHabits(data || [])
    setLoading(false)
  }, [userId])

  const createHabit = useCallback(
    async (name: string, icon: string = '⭐', color: string = '#FFE5D9') => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name,
          icon,
          color,
        })
        .select()
        .single()

      if (!error && data) {
        setHabits([data, ...habits])
        return data
      }
      return null
    },
    [userId, habits]
  )

  const logHabit = useCallback(
    async (habitId: string, logDate: string = new Date().toISOString().split('T')[0]) => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          user_id: userId,
          habit_id: habitId,
          log_date: logDate,
        })
        .select()
        .single()

      return !error ? (data as HabitLog) : null
    },
    [userId]
  )

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!userId) return false

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId)

      if (!error) {
        setHabits(habits.filter((h) => h.id !== habitId))
        return true
      }
      return false
    },
    [userId, habits]
  )

  return {
    habits,
    loading,
    fetchHabits,
    createHabit,
    logHabit,
    deleteHabit,
  }
}
