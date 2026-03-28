import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'

type Step = 1 | 2

type ModuleOption = {
  key:
    | 'study_enabled'
    | 'exercise_enabled'
    | 'habits_enabled'
    | 'cooking_enabled'
    | 'goals_enabled'
    | 'mood_enabled'
    | 'gratitude_enabled'
  label: string
  colorClass: string
}

const moduleOptions: ModuleOption[] = [
  { key: 'study_enabled', label: 'Estudio', colorClass: 'border-purple-200 bg-purple-50' },
  { key: 'exercise_enabled', label: 'Ejercicio', colorClass: 'border-teal-200 bg-teal-50' },
  { key: 'habits_enabled', label: 'Hábitos', colorClass: 'border-emerald-200 bg-emerald-50' },
  { key: 'cooking_enabled', label: 'Cocina', colorClass: 'border-orange-200 bg-orange-50' },
  { key: 'goals_enabled', label: 'Metas', colorClass: 'border-pink-200 bg-pink-50' },
  { key: 'mood_enabled', label: 'Estado de ánimo', colorClass: 'border-rose-200 bg-rose-50' },
  { key: 'gratitude_enabled', label: 'Gratitud', colorClass: 'border-lime-200 bg-lime-50' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { loading, refreshProfile, requiresOnboarding, session } = useSession()

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [wakeUpTime, setWakeUpTime] = useState('05:20')
  const [selectedModules, setSelectedModules] = useState<Set<ModuleOption['key']>>(
    new Set(['study_enabled', 'exercise_enabled', 'habits_enabled', 'cooking_enabled', 'goals_enabled'])
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    async function loadInitialData() {
      const profileRes = await supabase
        .from('profiles')
        .select('full_name, wake_up_time')
        .eq('id', userId)
        .maybeSingle<{ full_name: string | null; wake_up_time: string | null }>()

      if (profileRes.data?.full_name) {
        setName(profileRes.data.full_name)
      }

      if (profileRes.data?.wake_up_time) {
        setWakeUpTime(profileRes.data.wake_up_time)
      }
    }

    void loadInitialData()
  }, [session?.user.id])

  const canContinue = useMemo(() => name.trim().length >= 2, [name])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-sm font-semibold text-purple-800">Cargando onboarding...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!requiresOnboarding) {
    return <Navigate to="/dashboard" replace />
  }

  const toggleModule = (key: ModuleOption['key']) => {
    setSelectedModules((previous) => {
      const next = new Set(previous)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    const userId = session.user.id

    setSaving(true)
    setError(null)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        wake_up_time: wakeUpTime,
      })
      .eq('id', userId)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    const { error: settingsError } = await supabase.from('user_settings').upsert(
      {
        user_id: userId,
        study_enabled: selectedModules.has('study_enabled'),
        exercise_enabled: selectedModules.has('exercise_enabled'),
        habits_enabled: selectedModules.has('habits_enabled'),
        cooking_enabled: selectedModules.has('cooking_enabled'),
        goals_enabled: selectedModules.has('goals_enabled'),
        mood_enabled: selectedModules.has('mood_enabled'),
        gratitude_enabled: selectedModules.has('gratitude_enabled'),
      },
      { onConflict: 'user_id' }
    )

    if (settingsError) {
      setError(settingsError.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setSaving(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fce7f3,_#ede9fe_50%,_#dbeafe_100%)] p-4">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-32 right-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-purple-200 bg-white/85 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className={[
              'h-9 w-9 rounded-full border-2 text-sm font-bold',
              step === 1
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-purple-200 bg-white text-purple-500',
            ].join(' ')}>
              <div className="flex h-full items-center justify-center">1</div>
            </div>
            <div className="h-0.5 w-16 bg-purple-200" />
            <div className={[
              'h-9 w-9 rounded-full border-2 text-sm font-bold',
              step === 2
                ? 'border-purple-500 bg-purple-500 text-white'
                : 'border-purple-200 bg-white text-purple-500',
            ].join(' ')}>
              <div className="flex h-full items-center justify-center">2</div>
            </div>
          </div>

          {step === 1 ? (
            <div>
              <h1 className="text-2xl font-black text-purple-950">Antes de empezar</h1>
              <p className="mt-1 text-sm text-purple-700">Cuéntame tu nombre y hora de despertar.</p>

              <label className="mt-5 block space-y-2">
                <span className="text-xs font-bold uppercase text-purple-800">Nombre completo</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="mt-4 block space-y-2">
                <span className="text-xs font-bold uppercase text-purple-800">Hora de despertar</span>
                <input
                  type="time"
                  value={wakeUpTime}
                  onChange={(event) => setWakeUpTime(event.target.value)}
                  className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm"
                />
              </label>

              {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="mt-6 inline-flex items-center rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continuar
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-black text-purple-950">Elige tus módulos</h1>
              <p className="mt-1 text-sm text-purple-700">Activa lo que quieras usar desde hoy.</p>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {moduleOptions.map((module) => {
                  const isSelected = selectedModules.has(module.key)

                  return (
                    <button
                      key={module.key}
                      type="button"
                      title={module.label}
                      onClick={() => toggleModule(module.key)}
                      className={[
                        'flex items-center justify-between rounded-2xl border px-3 py-3 text-left',
                        module.colorClass,
                        isSelected ? 'ring-2 ring-purple-300' : '',
                      ].join(' ')}
                    >
                      <span className="text-sm font-semibold text-slate-800">{module.label}</span>
                      <span>
                        {isSelected ? (
                          <Check className="h-4 w-4 text-purple-600" />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>

              {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-800"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmit()
                  }}
                  disabled={saving}
                  className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : '¡Empezar con Mochi!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
