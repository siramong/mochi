// hooks/useScreenTheme.ts
import { useEffect } from 'react'
import { useSystemBars } from '@/context/SystemBarsContext'

type SystemBarsTheme = {
  backgroundColor: string
  statusBarStyle: 'light' | 'dark'
}

export function useScreenTheme(theme: SystemBarsTheme) {
  const { setTheme } = useSystemBars()

  useEffect(() => {
    setTheme(theme)
  }, [theme.backgroundColor, theme.statusBarStyle, setTheme])
}