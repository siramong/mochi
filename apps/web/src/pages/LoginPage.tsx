import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { getAuthCallbackUrl, POST_AUTH_REDIRECT_PATH } from '@/lib/auth-redirect'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

type Tab = 'login' | 'signup'
type AuthState = 'form' | 'email-sent'

interface FormErrors {
  email?: string
  password?: string
  passwordConfirm?: string
  general?: string
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="20"
        fontWeight="bold"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        G
      </text>
    </svg>
  )
}

interface EmailSentScreenProps {
  email: string
  onBack: () => void
}

function EmailSentScreen({ email, onBack }: EmailSentScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fce7f3,_#ede9fe_50%,_#dbeafe_100%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-purple-200 bg-white/85 p-8 shadow-sm backdrop-blur-sm">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-4 inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-100"
          >
            <CheckCircle2 className="h-9 w-9 text-purple-700" />
          </motion.div>

          <h2 className="mt-4 text-2xl font-extrabold text-purple-900">¡Revisa tu correo!</h2>

          <p className="mt-3 text-sm text-purple-700">
            Te enviamos un enlace de verificación a
            <br />
            <span className="font-semibold text-purple-900">{email}</span>
            <br />
            <br />
            Haz clic en el enlace para activar tu cuenta.
          </p>

          <button
            onClick={onBack}
            className="mt-6 rounded-2xl bg-purple-100 px-6 py-2.5 font-semibold text-purple-700 transition-colors hover:bg-purple-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { session, loading } = useSession()

  const [tab, setTab] = useState<Tab>('login')
  const [authState, setAuthState] = useState<AuthState>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [sentEmail, setSentEmail] = useState('')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-purple-800">Cargando...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to={POST_AUTH_REDIRECT_PATH} replace />
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
    setErrors({})
    setAuthState('form')
  }

  function switchTab(newTab: Tab) {
    setTab(newTab)
    resetForm()
  }

  function mapAuthError(message: string): string {
    if (message.includes('Invalid login credentials'))
      return 'Correo o contraseña incorrectos'
    if (message.includes('Email not confirmed'))
      return 'Confirma tu correo antes de continuar'
    if (message.includes('User already registered'))
      return 'Ya existe una cuenta con ese correo'
    if (message.includes('Password should be at least 6 characters'))
      return 'La contraseña debe tener al menos 6 caracteres'
    return message
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: FormErrors = {}

    if (!email.trim()) newErrors.email = 'Ingresa tu correo'
    if (!password) newErrors.password = 'Ingresa tu contraseña'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrors({ general: mapAuthError(error.message) })
      }
    } catch {
      setErrors({
        general: 'Ocurrió un error. Intenta de nuevo.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: FormErrors = {}

    if (!email.trim()) newErrors.email = 'Ingresa tu correo'
    if (!password) newErrors.password = 'Ingresa tu contraseña'
    if (password.length < 6)
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    if (!passwordConfirm) newErrors.passwordConfirm = 'Confirma tu contraseña'
    if (password !== passwordConfirm && password && passwordConfirm)
      newErrors.passwordConfirm = 'Las contraseñas no coinciden'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const redirectTo = getAuthCallbackUrl()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      if (error) {
        setErrors({ general: mapAuthError(error.message) })
      } else {
        setSentEmail(email)
        setAuthState('email-sent')
      }
    } catch {
      setErrors({
        general: 'Ocurrió un error. Intenta de nuevo.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setErrors({})

    try {
      const redirectTo = getAuthCallbackUrl()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        setErrors({ general: 'No se pudo iniciar sesión con Google. Intenta de nuevo.' })
      } else if (data?.url) {
        window.location.href = data.url
      }
    } catch {
      setErrors({
        general: 'Ocurrió un error. Intenta de nuevo.',
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  if (authState === 'email-sent') {
    return <EmailSentScreen email={sentEmail} onBack={resetForm} />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fce7f3,_#ede9fe_50%,_#dbeafe_100%)] p-4">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-32 right-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl border border-purple-200 bg-white/85 p-8 shadow-sm backdrop-blur-sm"
        >
          {/* Mascot */}
          <motion.div
            animate={{ y: [-8, 0, -8] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex justify-center mb-5"
          >
            <img
              src="/mascot/mochi-icon.png"
              alt="Mochi"
              className="h-20 w-20 rounded-2xl border border-purple-200 bg-white/90 p-1"
            />
          </motion.div>

          {/* Header */}
          <h1 className="text-center text-3xl font-extrabold text-purple-900">Mochi</h1>
          <p className="mt-1 text-center text-sm text-purple-600">Tu espacio de productividad</p>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 rounded-full bg-purple-100 p-1">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                tab === 'login'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-400'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                tab === 'signup'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-400'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={tab === 'login' ? handleSignIn : handleSignUp}
            className="mt-6 space-y-4"
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={isLoading || isGoogleLoading}
                className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-purple-900 placeholder-purple-300 transition-colors focus:border-purple-400 focus:outline-none disabled:bg-purple-50"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-purple-900 placeholder-purple-300 transition-colors focus:border-purple-400 focus:outline-none disabled:bg-purple-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isGoogleLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Password Confirm (signup only) */}
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-purple-900 placeholder-purple-300 transition-colors focus:border-purple-400 focus:outline-none disabled:bg-purple-50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    disabled={isLoading || isGoogleLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm}</p>
                )}
              </div>
            )}

            {/* General error */}
            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full rounded-2xl bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-purple-200" />
            <p className="text-xs text-purple-500 font-semibold">o continúa con</p>
            <div className="flex-1 border-t border-purple-200" />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 font-semibold text-purple-900 transition-colors hover:bg-purple-50 disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <GoogleLogo />
                Continuar con Google
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
