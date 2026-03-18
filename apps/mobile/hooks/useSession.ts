import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type ProfileRow = {
  full_name: string | null
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    const profile = data as ProfileRow
    const hasName = Boolean(profile.full_name?.trim())
    setRequiresOnboarding(!hasName)
  }

  async function refreshProfile() {
    if (!session?.user.id) return

    try {
      setLoading(true)
      setProfileError(null)
      await fetchProfile(session.user.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el perfil'
      setProfileError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const syncSession = async (nextSession: Session | null) => {
      if (!mounted) return

      setSession(nextSession)

      if (!nextSession?.user.id) {
        setRequiresOnboarding(false)
        setProfileError(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setProfileError(null)
        await fetchProfile(nextSession.user.id)
      } catch (error) {
        if (!mounted) return
        const message = error instanceof Error ? error.message : 'No se pudo cargar el perfil'
        setProfileError(message)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void syncSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading, requiresOnboarding, profileError, refreshProfile }
}