import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useSessionContext } from '@/contexts/SessionContext'
import type { UserSettings } from '@/types/database'

type EnabledModules = {
  study: boolean
  exercise: boolean
  habits: boolean
  goals: boolean
  mood: boolean
  gratitude: boolean
  vouchers: boolean
  cooking: boolean
  notes: boolean
}

type SettingsContextValue = {
  settings: UserSettings | null
  loading: boolean
  error: string | null
  enabledModules: EnabledModules
  refresh: () => Promise<void>
}

const defaultEnabledModules: EnabledModules = {
  study: true,
  exercise: true,
  habits: true,
  goals: true,
  mood: true,
  gratitude: true,
  vouchers: false,
  cooking: true,
  notes: true,
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

type SettingsProviderProps = {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { session } = useSessionContext()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setSettings(null)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<UserSettings>()

    if (settingsError) {
      setError(settingsError.message)
      setLoading(false)
      return
    }

    setSettings(data ?? null)
    setLoading(false)
  }, [session?.user.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const enabledModules = useMemo<EnabledModules>(() => {
    if (!settings) return defaultEnabledModules

    return {
      study: settings.study_enabled,
      exercise: settings.exercise_enabled,
      habits: settings.habits_enabled,
      goals: settings.goals_enabled,
      mood: settings.mood_enabled,
      gratitude: settings.gratitude_enabled,
      vouchers: settings.vouchers_enabled && settings.partner_features_enabled,
      cooking: settings.cooking_enabled,
      notes: settings.notes_enabled ?? true,
    }
  }, [settings])

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      enabledModules,
      refresh,
    }),
    [settings, loading, error, enabledModules, refresh],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettingsContext debe usarse dentro de SettingsProvider')
  }
  return context
}
