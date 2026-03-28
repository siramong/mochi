import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Habit, HabitLog } from '@/types/database'

export type HabitIcon = 'leaf' | 'water' | 'book' | 'heart' | 'fitness'
export type HabitColor = 'pink' | 'yellow' | 'blue' | 'teal' | 'purple'

const allowedIcons = new Set<HabitIcon>(['leaf', 'water', 'book', 'heart', 'fitness'])
const allowedColors = new Set<HabitColor>(['pink', 'yellow', 'blue', 'teal', 'purple'])

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

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
      .order('created_at', { ascending: true })

    if (!error) {
      setHabits((data ?? []) as Habit[])
    }

    setLoading(false)
  }, [userId])

  const createHabit = useCallback(
    async (name: string, icon: HabitIcon = 'leaf', color: HabitColor = 'pink') => {
      if (!userId) return null

      const safeIcon: HabitIcon = allowedIcons.has(icon) ? icon : 'leaf'
      const safeColor: HabitColor = allowedColors.has(color) ? color : 'pink'

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name,
          icon: safeIcon,
          color: safeColor,
        })
        .select('*')
        .single<Habit>()

      if (!error && data) {
        setHabits((previous) => [data, ...previous])
        return data
      }

      return null
    },
    [userId]
  )

  const logHabit = useCallback(
    async (habitId: string, logDate: string = todayISO()) => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('habit_logs')
        .insert({
          user_id: userId,
          habit_id: habitId,
          log_date: logDate,
        })
        .select('*')
        .single<HabitLog>()

      return !error ? data : null
    },
    [userId]
  )

  const deleteHabitLog = useCallback(
    async (userIdParam: string, habitId: string, date: string) => {
      if (!userId || userId !== userIdParam) return false

      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('log_date', date)

      return !error
    },
    [userId]
  )

  const fetchWeeklyLogs = useCallback(
    async (userIdParam: string): Promise<Map<string, Set<string>>> => {
      const weekMap = new Map<string, Set<string>>()
      if (!userId || userId !== userIdParam) return weekMap

      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 6)

      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date')
        .eq('user_id', userId)
        .gte('log_date', weekStart.toISOString().slice(0, 10))
        .lte('log_date', todayISO())

      if (error) return weekMap

      for (const row of data ?? []) {
        const existing = weekMap.get(row.habit_id)
        if (existing) {
          existing.add(row.log_date)
        } else {
          weekMap.set(row.habit_id, new Set([row.log_date]))
        }
      }

      return weekMap
    },
    [userId]
  )

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!userId) return false

      const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId)

      if (!error) {
        setHabits((previous) => previous.filter((habit) => habit.id !== habitId))
        return true
      }

      return false
    },
    [userId]
  )

  return {
    habits,
    loading,
    fetchHabits,
    fetchWeeklyLogs,
    createHabit,
    logHabit,
    deleteHabitLog,
    deleteHabit,
  }
}
