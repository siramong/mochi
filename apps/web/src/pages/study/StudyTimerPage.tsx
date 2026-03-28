import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pause, Play, Save, Sparkles, Upload } from 'lucide-react'
import { detectStudyDiscipline, generateStudySessionPlan } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { useStudyCompanion, type StudyAttachment } from '@/hooks/useStudyCompanion'
import { useSession } from '@/hooks/useSession'
import { useStudyBlocks } from '@/hooks/useStudyBlocks'
import { addPoints, checkAndUnlockStudyAchievements, trackEngagementEvent } from '@/lib/gamification'
import type { StudyBlock } from '@/types/database'

type StudyPhase = 'setup' | 'studying' | 'complete'

function parseTimeToSeconds(timeValue: string): number {
  const [hours, minutes] = timeValue.split(':').map(Number)
  return (hours * 60 + minutes) * 60
}

function calcDurationSeconds(startTime: string, endTime: string): number {
  return parseTimeToSeconds(endTime) - parseTimeToSeconds(startTime)
}

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const rest = safeSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function buildSessionSummary(topic: string): string {
  const clean = topic.trim()
  if (!clean) return 'Consolidaste una sesión enfocada con disciplina y claridad.'
  return `Trabajaste en ${clean.slice(0, 100)}${clean.length > 100 ? '...' : ''} y reforzaste tus ideas clave.`
}

async function fileToAttachment(file: File): Promise<StudyAttachment> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const payload = result.includes(',') ? result.split(',')[1] : ''
      resolve(payload)
    }
    reader.readAsDataURL(file)
  })

  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64,
  }
}

export function StudyTimerPage() {
  const { session } = useSession()
  const { blocks } = useStudyBlocks()
  const [searchParams] = useSearchParams()
  const blockId = searchParams.get('blockId')

  const [selectedBlockId] = useState<string | null>(blockId)
  const [durationSeconds, setDurationSeconds] = useState(45 * 60)
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSessionPersisted, setIsSessionPersisted] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [gamificationWarning, setGamificationWarning] = useState<string | null>(null)
  const [phase, setPhase] = useState<StudyPhase>('setup')

  const [specificTopic, setSpecificTopic] = useState('')
  const [discipline, setDiscipline] = useState('estudio general')
  const [setupAttachment, setSetupAttachment] = useState<StudyAttachment | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [disciplineNotice, setDisciplineNotice] = useState<string | null>(null)
  const [planText, setPlanText] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatUploadError, setChatUploadError] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const saveInFlightRef = useRef<Promise<boolean> | null>(null)
  const isSessionPersistedRef = useRef(false)
  const hasAutoSaveAttemptRef = useRef(false)

  const selectedBlock = useMemo<StudyBlock | null>(() => {
    if (!selectedBlockId) return null
    return blocks.find((block) => block.id === selectedBlockId) ?? null
  }, [blocks, selectedBlockId])

  useEffect(() => {
    if (!selectedBlock) return

    const calculated = calcDurationSeconds(selectedBlock.start_time, selectedBlock.end_time)
    const safeValue = calculated > 0 ? calculated : 45 * 60

    setDurationSeconds(safeValue)
    setTimeLeft(safeValue)
    setIsRunning(false)
    setIsSessionPersisted(false)
    isSessionPersistedRef.current = false
    hasAutoSaveAttemptRef.current = false
    setSavedMessage(null)
    setGamificationWarning(null)
  }, [selectedBlock])

  useEffect(() => {
    if (!isRunning || phase !== 'studying') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          setIsRunning(false)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, phase])

  const resolvedSubject = selectedBlock?.subject || 'Sesión de enfoque'
  const progressPercent = durationSeconds > 0 ? (timeLeft / durationSeconds) * 100 : 0
  const elapsedSeconds = Math.max(0, durationSeconds - timeLeft)

  const companion = useStudyCompanion(resolvedSubject, specificTopic, discipline)

  const ensureDiscipline = async (showFallbackNotice = false) => {
    if (discipline !== 'estudio general' || !specificTopic.trim()) return discipline

    try {
      const detected = await detectStudyDiscipline(resolvedSubject, specificTopic.trim())
      const normalizedDiscipline = detected.trim() ? detected.trim() : 'estudio general'
      setDiscipline(normalizedDiscipline)
      return normalizedDiscipline
    } catch {
      const fallbackDiscipline = 'estudio general'
      setDiscipline(fallbackDiscipline)

      if (showFallbackNotice) {
        setDisciplineNotice('No pudimos detectar la disciplina con IA en este momento. La sesión iniciará con "estudio general" para que puedas continuar sin interrupciones.')
      }

      return fallbackDiscipline
    }
  }

  const saveSession = useCallback(async (): Promise<boolean> => {
    if (isSessionPersistedRef.current) {
      return true
    }

    if (saveInFlightRef.current) {
      return saveInFlightRef.current
    }

    const userId = session?.user.id
    if (!userId) {
      setSavedMessage('Debes iniciar sesión para guardar tu sesión de estudio')
      return false
    }

    if (elapsedSeconds <= 0) {
      setSavedMessage('No hay tiempo registrado para guardar en el historial')
      return false
    }

    const savePromise = (async () => {
      setIsSaving(true)
      setSavedMessage(null)
      setGamificationWarning(null)

      try {
        const completedAt = new Date().toISOString()
        const { data: insertedSession, error } = await supabase
          .from('study_sessions')
          .insert({
            user_id: userId,
            study_block_id: selectedBlock?.id ?? null,
            subject: resolvedSubject,
            duration_seconds: elapsedSeconds,
            completed_at: completedAt,
          })
          .select('id')
          .single<{ id: string }>()

        if (error) {
          setSavedMessage(`No se pudo guardar: ${error.message}`)
          return false
        }

        if (!insertedSession) {
          setSavedMessage('No se pudo confirmar la sesión guardada')
          return false
        }

        isSessionPersistedRef.current = true
        setIsSessionPersisted(true)

        const warnings: string[] = []
        let engagementResult: 'created' | 'duplicate' | null = null

        try {
          engagementResult = await trackEngagementEvent({
            userId,
            eventName: 'study_session_completed',
            eventKey: `study_session_completed:${insertedSession.id}`,
            sourceTable: 'study_sessions',
            sourceId: insertedSession.id,
            occurredAt: completedAt,
            payload: {
              study_session_id: insertedSession.id,
              subject: resolvedSubject,
              duration_seconds: elapsedSeconds,
              points_candidate: 5,
            },
          })
        } catch (engagementError) {
          warnings.push('Tu sesión se guardó, pero no pudimos registrar el evento de gamificación. Intenta de nuevo más tarde.')
          console.warn('No se pudo registrar engagement event de sesión de estudio:', engagementError)
        }

        if (engagementResult === 'created') {
          try {
            await addPoints(userId, 5)
            await checkAndUnlockStudyAchievements(userId)
          } catch (gamificationError) {
            warnings.push('Tu sesión se guardó, pero no pudimos actualizar puntos o logros. Intenta de nuevo más tarde.')
            console.warn('No se pudo completar actualización de puntos/logros de estudio:', gamificationError)
          }
        }

        if (engagementResult === 'duplicate') {
          warnings.push('Esta sesión ya estaba registrada en gamificación, por lo que no se volvieron a sumar puntos.')
        }

        setSavedMessage('Sesión guardada en tu historial de estudio')

        if (warnings.length > 0) {
          setGamificationWarning(warnings.join(' '))
        }

        return true
      } catch (error) {
        setSavedMessage(error instanceof Error ? error.message : 'No se pudo guardar la sesión')
        return false
      } finally {
        setIsSaving(false)
        saveInFlightRef.current = null
      }
    })()

    saveInFlightRef.current = savePromise
    return savePromise
  }, [elapsedSeconds, resolvedSubject, selectedBlock?.id, session?.user.id])

  const finishSession = useCallback(async () => {
    const isSaved = await saveSession()
    if (isSaved) {
      setPhase('complete')
    }
  }, [saveSession])

  const handleSetupUpload = async (file: File | null) => {
    if (!file) return

    try {
      setPlanError(null)
      const attachment = await fileToAttachment(file)
      setSetupAttachment(attachment)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'No se pudo cargar el archivo')
    }
  }

  const handleChatUpload = async (file: File | null) => {
    if (!file) return

    try {
      setChatUploadError(null)
      const attachment = await fileToAttachment(file)
      companion.setAttachment(attachment)
    } catch (err) {
      setChatUploadError(err instanceof Error ? err.message : 'No se pudo cargar el archivo')
    }
  }

  const requestPlan = async () => {
    if (!specificTopic.trim()) return

    setPlanLoading(true)
    setPlanError(null)

    try {
      const detected = await ensureDiscipline()
      const response = await generateStudySessionPlan(
        resolvedSubject,
        specificTopic.trim(),
        Math.max(1, Math.round(durationSeconds / 60)),
        detected,
        setupAttachment?.base64,
        setupAttachment?.mimeType
      )
      setPlanText(response)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'No se pudo generar el plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const startSession = async () => {
    if (!specificTopic.trim()) return
    setDisciplineNotice(null)
    await ensureDiscipline(true)
    setSavedMessage(null)
    setGamificationWarning(null)
    setIsSessionPersisted(false)
    isSessionPersistedRef.current = false
    hasAutoSaveAttemptRef.current = false
    setPhase('studying')
    setIsRunning(true)
  }

  useEffect(() => {
    if (phase !== 'studying' || timeLeft !== 0 || isSaving || isSessionPersisted || hasAutoSaveAttemptRef.current) {
      return
    }

    hasAutoSaveAttemptRef.current = true

    void finishSession()
  }, [finishSession, phase, timeLeft, isSaving, isSessionPersisted])

  const sendChat = async () => {
    const normalized = chatQuestion.trim() || (companion.attachment ? 'Ayúdame con este archivo.' : '')
    if (!normalized) return

    await companion.ask(normalized)
    setChatQuestion('')
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Compañera de estudio IA</h1>
          <p className="text-sm text-purple-700">Temporizador con plan inteligente y chat para dudas en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/study" className="rounded-xl bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-900">
            Volver al horario
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-3xl border border-purple-200 bg-white p-5">
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-bold uppercase text-purple-700">Bloque activo</p>
            <p className="mt-1 text-lg font-black text-purple-950">{resolvedSubject}</p>
            <p className="text-xs font-semibold text-purple-600">
              {selectedBlock ? `${selectedBlock.start_time} - ${selectedBlock.end_time}` : 'Sesión personalizada'} · {Math.round(durationSeconds / 60)} min
            </p>
            <p className="mt-2 inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700">
              Disciplina: {discipline}
            </p>
          </div>

          {phase === 'setup' ? (
            <div className="mt-4 rounded-2xl border border-purple-200 p-4">
              <label className="block text-sm font-bold text-purple-900">¿Qué vas a estudiar específicamente hoy?</label>
              <textarea
                value={specificTopic}
                onChange={(event) => setSpecificTopic(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm"
                placeholder="Ej: Derivadas implícitas y problemas de optimización"
              />

              <div className="mt-3 rounded-xl border border-dashed border-purple-300 bg-purple-50 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-purple-800">
                  <Upload className="h-4 w-4" />
                  Adjuntar imagen o PDF
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(event) => void handleSetupUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
                {setupAttachment ? (
                  <p className="mt-2 text-xs font-semibold text-purple-700">{setupAttachment.name}</p>
                ) : (
                  <p className="mt-2 text-xs text-purple-600">Sin adjunto por ahora</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void requestPlan()
                  }}
                  disabled={planLoading || !specificTopic.trim()}
                  className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {planLoading ? 'Generando plan...' : 'Pedir plan a Mochi'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void startSession()
                  }}
                  disabled={!specificTopic.trim()}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Empezar sesión
                </button>
              </div>

              {planError ? <p className="mt-3 text-xs font-semibold text-red-600">{planError}</p> : null}
              {disciplineNotice ? <p className="mt-3 text-xs font-semibold text-amber-700">{disciplineNotice}</p> : null}
              {planText ? <p className="mt-3 rounded-xl bg-purple-50 p-3 text-sm text-purple-900">{planText}</p> : null}
            </div>
          ) : null}

          {phase !== 'setup' ? (
            <>
              <div className="mt-5 rounded-3xl border border-purple-200 bg-purple-50 p-5 text-center">
                <p className="text-sm font-semibold text-purple-700">{specificTopic}</p>
                <p className="mt-2 text-5xl font-black tracking-tight text-purple-950">{formatTimer(timeLeft)}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.max(0, progressPercent)}%` }} />
                </div>
              </div>

              {phase === 'studying' ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRunning((running) => !running)}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                    Preguntarle a Mochi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void finishSession()
                    }}
                    disabled={isSaving || elapsedSeconds <= 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar'}
                  </button>
                </div>
              ) : null}

              {phase === 'complete' ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-900">Resumen de la sesión</p>
                  <p className="mt-1 text-sm text-emerald-800">{buildSessionSummary(specificTopic)}</p>
                  {savedMessage ? <p className="mt-2 text-xs font-semibold text-emerald-700">{savedMessage}</p> : null}
                  {gamificationWarning ? <p className="mt-2 text-xs font-semibold text-orange-700">{gamificationWarning}</p> : null}
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-lg font-bold text-blue-950">Atajos de estudio</h2>
          <div className="mt-4 space-y-2">
            <Link to="/study/new" className="block rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
              Crear bloque semanal
            </Link>
            <Link to="/study/history" className="block rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
              Revisar historial de sesiones
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase text-blue-700">Tiempo registrado hoy</p>
            <p className="mt-1 text-2xl font-black text-blue-950">{formatTimer(elapsedSeconds)}</p>
          </div>
        </aside>
      </div>

      {chatOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/35 p-4 md:items-center md:justify-center">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-900">Compañera de estudio</p>
                <p className="text-xs text-purple-700">{specificTopic}</p>
              </div>
              <button type="button" onClick={() => setChatOpen(false)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                Cerrar
              </button>
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-purple-200 bg-purple-50 p-3">
              {companion.messages.length === 0 ? (
                <p className="text-sm text-purple-700">Haz una pregunta sobre teoría, ejercicios, código o fórmulas.</p>
              ) : (
                <div className="space-y-2">
                  {companion.messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`rounded-xl p-2 text-sm ${message.role === 'assistant' ? 'bg-white text-purple-900' : 'bg-blue-100 text-blue-900'}`}>
                      {message.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-dashed border-purple-300 bg-purple-50 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-purple-800">
                <Upload className="h-4 w-4" />
                Adjuntar imagen o PDF para esta pregunta
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => void handleChatUpload(event.target.files?.[0] ?? null)}
                />
              </label>
              {companion.attachment ? <p className="mt-1 text-xs font-semibold text-purple-700">{companion.attachment.name}</p> : null}
              {chatUploadError ? <p className="mt-1 text-xs font-semibold text-red-600">{chatUploadError}</p> : null}
            </div>

            <textarea
              value={chatQuestion}
              onChange={(event) => setChatQuestion(event.target.value)}
              className="mt-3 min-h-20 w-full rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm"
              placeholder="Escribe tu duda..."
            />

            {companion.error ? <p className="mt-2 text-xs font-semibold text-red-600">{companion.error}</p> : null}

            <button
              type="button"
              onClick={() => {
                void sendChat()
              }}
              disabled={companion.loading || !(chatQuestion.trim() || companion.attachment)}
              className="mt-3 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {companion.loading ? 'Consultando...' : 'Enviar a Mochi'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
