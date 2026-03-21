import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import {
  getCurrentCyclePhase,
  hasCyclePermissions,
  requestCyclePermissions,
  type CyclePhaseData,
} from '@/src/shared/lib/healthConnect'

type CycleContextValue = {
  cycleData: CyclePhaseData | null
  loading: boolean
  hasPermission: boolean
  requestPermission: () => Promise<void>
  refresh: () => Promise<void>
}

const CycleContext = createContext<CycleContextValue>({
  cycleData: null,
  loading: true,
  hasPermission: false,
  requestPermission: async () => {},
  refresh: async () => {},
})

export function CycleProvider({ children }: { children: ReactNode }) {
  const [cycleData, setCycleData] = useState<CyclePhaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const granted = await hasCyclePermissions()
      setHasPermission(granted)

      if (!granted) {
        setCycleData(null)
        return
      }

      const phase = await getCurrentCyclePhase()
      setCycleData(phase)
    } catch {
      setHasPermission(false)
      setCycleData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      const granted = await requestCyclePermissions()
      setHasPermission(granted)

      if (granted) {
        const phase = await getCurrentCyclePhase()
        setCycleData(phase)
      } else {
        setCycleData(null)
      }
    } catch {
      setHasPermission(false)
      setCycleData(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refresh()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [refresh])

  const value = useMemo<CycleContextValue>(
    () => ({
      cycleData,
      loading,
      hasPermission,
      requestPermission,
      refresh,
    }),
    [cycleData, hasPermission, loading, refresh, requestPermission]
  )

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>
}

export function useCycle(): CycleContextValue {
  return useContext(CycleContext)
}

export default CycleProvider
