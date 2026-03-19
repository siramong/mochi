import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type SessionContextValue = {
  session: Session | null
  loading: boolean
  requiresOnboarding: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

type SessionProviderProps = {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setRequiresOnboarding(!data?.full_name?.trim())
      setProfileError(null)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
    }
  }, [session?.user.id])

  useEffect(() => {
    let mounted = true

    async function initializeSession() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)

      if (initialSession?.user.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', initialSession.user.id)
            .single()

          if (error) throw error
          setRequiresOnboarding(!data?.full_name?.trim())
          setProfileError(null)
        } catch (error) {
          setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
        }
      }

      setLoading(false)
    }

    void initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (!mounted) return

        setSession(nextSession)

        if (!nextSession) {
          setRequiresOnboarding(false)
          setProfileError(null)
          return
        }

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', nextSession.user.id)
            .single()

          if (error) throw error
          setRequiresOnboarding(!data?.full_name?.trim())
          setProfileError(null)
        } catch (error) {
          setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
        }
      }
    )

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
    }),
    [session, loading, requiresOnboarding, profileError, refreshProfile]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }

  return context
}