import { useEffect, useState } from 'react'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  async function refreshProfile() {
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
  }

  useEffect(() => {
    console.log('🔵 useEffect iniciado')

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('🟢 getSession:', session?.user.id ?? 'sin sesión')
      setSession(session)
      if (session?.user.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single()
          console.log('🟡 perfil:', JSON.stringify(data), 'error:', error?.message)
          if (error) throw error
          setRequiresOnboarding(!data?.full_name?.trim())
        } catch (error) {
          console.log('🔴 error perfil:', error)
          setProfileError(error instanceof Error ? error.message : 'Error cargando perfil')
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        console.log('🟠 onAuthStateChange:', _event, nextSession?.user.id ?? 'null')
        setSession(nextSession)
        if (!nextSession) {
          setRequiresOnboarding(false)
          setProfileError(null)
        }
      }
    )

    return () => {
      console.log('🔴 cleanup')
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading, requiresOnboarding, profileError, refreshProfile }
}