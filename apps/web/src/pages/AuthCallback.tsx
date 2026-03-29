import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { POST_AUTH_REDIRECT_PATH } from '@/lib/auth-redirect'
import { supabase } from '@/lib/supabase'

type CallbackStatus = 'loading' | 'success' | 'error'
const CALLBACK_SESSION_TIMEOUT_MS = 15_000

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    let fallbackSubscription: { unsubscribe: () => void } | null = null

    function decodeAuthMessage(rawMessage: string): string {
      return decodeURIComponent(rawMessage.replace(/\+/g, ' '))
    }

    function getProviderError(): string | null {
      const currentUrl = new URL(window.location.href)
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''))
      const errorRaw =
        currentUrl.searchParams.get('error_description') ??
        hashParams.get('error_description') ??
        currentUrl.searchParams.get('error') ??
        hashParams.get('error')

      if (!errorRaw) return null
      return decodeAuthMessage(errorRaw)
    }

    async function waitForSessionFallback(): Promise<boolean> {
      return new Promise((resolve) => {
        let settled = false
        let polling = false

        function cleanup() {
          if (fallbackSubscription) {
            fallbackSubscription.unsubscribe()
            fallbackSubscription = null
          }
          window.clearInterval(pollingIntervalId)
          window.clearTimeout(timeoutId)
        }

        function finish(recovered: boolean) {
          if (settled) return
          settled = true
          cleanup()
          resolve(recovered)
        }

        async function tryReadSession() {
          if (polling || settled) return
          polling = true
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession()

            if (session) {
              finish(true)
            }
          } catch {
            // Ignoramos errores transitorios durante la espera de recuperación.
          } finally {
            polling = false
          }
        }

        const timeoutId = window.setTimeout(() => {
          finish(false)
        }, CALLBACK_SESSION_TIMEOUT_MS)

        const pollingIntervalId = window.setInterval(() => {
          void tryReadSession()
        }, 750)

        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession) {
            finish(true)
          }
        })

        fallbackSubscription = data.subscription
        void tryReadSession()
      })
    }

    async function handleCallback() {
      try {
        const providerError = getProviderError()
        if (providerError) {
          throw new Error(providerError)
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (session) {
          setStatus('success')
          setMessage('Tu sesión fue validada correctamente. Entrando a tu dashboard...')
          window.setTimeout(() => {
            if (active) {
              navigate(POST_AUTH_REDIRECT_PATH, { replace: true })
            }
          }, 700)
          return
        }

        const recovered = await waitForSessionFallback()
        if (recovered) {
          setStatus('success')
          setMessage('Tu sesión fue validada correctamente. Entrando a tu dashboard...')
          window.setTimeout(() => {
            if (active) {
              navigate(POST_AUTH_REDIRECT_PATH, { replace: true })
            }
          }, 700)
          return
        }

        throw new Error('No pudimos validar tu sesión a tiempo. Revisa tu conexión e intenta iniciar sesión nuevamente.')
      } catch (err) {
        if (!active) return

        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Ocurrió un error inesperado al validar tu acceso.')
      }
    }

    void handleCallback()

    return () => {
      active = false
      if (fallbackSubscription) {
        fallbackSubscription.unsubscribe()
      }
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-purple-200 bg-white p-8 text-center shadow-sm">

        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-5 h-14 w-14 animate-spin text-purple-600" />
            <h2 className="text-lg font-extrabold text-purple-900">Verificando tu cuenta...</h2>
            <p className="mt-2 text-sm text-purple-500">Estamos confirmando tu acceso de forma segura.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-5 h-16 w-16 text-green-600" />
            <h2 className="text-xl font-extrabold text-purple-900">Acceso validado</h2>
            <p className="mt-2 text-sm font-semibold text-purple-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mx-auto mb-5 h-16 w-16 text-red-500" />
            <h2 className="text-xl font-extrabold text-purple-900">No se pudo completar el acceso</h2>
            <p className="mt-2 text-sm font-semibold text-red-500">{message}</p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-block rounded-2xl bg-purple-600 px-6 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
              >
                Ir a iniciar sesión
              </Link>
              <Link
                to="/"
                className="inline-block rounded-2xl border border-purple-200 bg-white px-6 py-3 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-50"
              >
                Volver al inicio
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default AuthCallback