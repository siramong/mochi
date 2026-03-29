import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SessionContextValue = {
  session: Session | null
  loading: boolean
  requiresOnboarding: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

type SessionProviderProps = {
  children: ReactNode
}

const SESSION_TIMEOUT_MS = 8000
const PROFILE_TIMEOUT_MS = 8000

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)
  })

  try {
    return (await Promise.race([promise, timeoutPromise])) as T
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function fetchOnboardingStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return !data?.full_name?.trim()
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return

    try {
      const needsOnboarding = await withTimeout(
        fetchOnboardingStatus(session.user.id),
        PROFILE_TIMEOUT_MS,
        'Tiempo de espera agotado al cargar perfil',
      )
      setRequiresOnboarding(needsOnboarding)
      setProfileError(null)
    } catch (error) {
      setRequiresOnboarding(false)
      setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
    }
  }, [session?.user.id])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        const {
          data: { session: initialSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          'Tiempo de espera agotado al cargar sesión',
        )

        if (!mounted) return

        setSession(initialSession)

        if (initialSession?.user.id) {
          try {
            const needsOnboarding = await withTimeout(
              fetchOnboardingStatus(initialSession.user.id),
              PROFILE_TIMEOUT_MS,
              'Tiempo de espera agotado al cargar perfil',
            )
            if (mounted) {
              setRequiresOnboarding(needsOnboarding)
              setProfileError(null)
            }
          } catch (error) {
            if (mounted) {
              setRequiresOnboarding(false)
              setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
            }
          }
        }
      } catch (error) {
        if (mounted) {
          setSession(null)
          setRequiresOnboarding(false)
          setProfileError(error instanceof Error ? error.message : 'Error cargando sesión')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, nextSession: Session | null) => {
      if (!mounted) return

      setSession(nextSession)

      if (!nextSession) {
        setRequiresOnboarding(false)
        setProfileError(null)
        return
      }

      try {
        const needsOnboarding = await withTimeout(
          fetchOnboardingStatus(nextSession.user.id),
          PROFILE_TIMEOUT_MS,
          'Tiempo de espera agotado al cargar perfil',
        )
        if (mounted) {
          setRequiresOnboarding(needsOnboarding)
          setProfileError(null)
        }
      } catch (error) {
        if (mounted) {
          setRequiresOnboarding(false)
          setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      requiresOnboarding,
      profileError,
      refreshProfile,
      signOut,
    }),
    [session, loading, requiresOnboarding, profileError, refreshProfile, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSessionContext debe usarse dentro de SessionProvider')
  }
  return context
}
