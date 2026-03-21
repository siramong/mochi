import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type CallbackStatus = 'loading' | 'success' | 'error'

export function AuthCallback() {
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    async function handleCallback() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus('error')
          setMessage('El enlace es inválido o ya expiró.')
          return
        }

        if (data.session) {
          setStatus('success')
          setTimeout(() => { window.location.replace('/') }, 1800)
          return
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setStatus('success')
            authListener.subscription.unsubscribe()
            setTimeout(() => { window.location.replace('/') }, 1800)
          }
        })

        subscription = authListener.subscription

        setTimeout(() => {
          if (subscription) subscription.unsubscribe()
          setStatus((prev) => {
            if (prev === 'loading') {
              setMessage('El enlace expiró o ya fue usado. Inicia sesión directamente.')
              return 'error'
            }
            return prev
          })
        }, 12_000)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Error inesperado')
      }
    }

    void handleCallback()

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-purple-200 bg-white p-8 text-center shadow-sm">

        {status === 'loading' && (
          <>
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
            <h2 className="text-lg font-extrabold text-purple-900">Verificando tu cuenta...</h2>
            <p className="mt-2 text-sm text-purple-500">Solo un momento</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-9 w-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-purple-900">¡Cuenta verificada!</h2>
            <p className="mt-2 text-sm font-semibold text-purple-600">
              Bienvenida a Mochi. Entrando a tu espacio...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-9 w-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-purple-900">Algo salió mal</h2>
            <p className="mt-2 text-sm font-semibold text-red-500">{message}</p>
            <a href="/" className="mt-6 inline-block rounded-2xl bg-purple-600 px-6 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90">
              Ir al inicio
            </a>
          </>
        )}

      </div>
    </div>
  )
}

export default AuthCallback