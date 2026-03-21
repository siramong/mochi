import { useSettingsContext } from '@/contexts/SettingsContext'

export function useUserSettings() {
  return useSettingsContext()
}
