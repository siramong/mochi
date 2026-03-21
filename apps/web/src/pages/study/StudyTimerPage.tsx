import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pause, Play, RotateCcw, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { useStudyBlocks } from '@/hooks/useStudyBlocks'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import type { StudyBlock } from '@/types/database'

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

const quickDurations = [25, 45, 60, 90]

export function StudyTimerPage() {
  const { session } = useSession()
  const { blocks } = useStudyBlocks()
  const [searchParams] = useSearchParams()
  const blockId = searchParams.get('blockId')

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blockId)
  const [customSubject, setCustomSubject] = useState('')
  const [customMinutes, setCustomMinutes] = useState(45)
  const [durationSeconds, setDurationSeconds] = useState(45 * 60)
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    setCustomSubject(selectedBlock.subject)
    setIsRunning(false)
  }, [selectedBlock])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const progressPercent = durationSeconds > 0 ? (timeLeft / durationSeconds) * 100 : 0

  const resolvedSubject = selectedBlock?.subject || customSubject.trim() || 'Sesión de enfoque'
  const elapsedSeconds = Math.max(0, durationSeconds - timeLeft)

  const applyQuickDuration = (minutes: number) => {
    const seconds = minutes * 60
    setSelectedBlockId(null)
    setDurationSeconds(seconds)
    setTimeLeft(seconds)
    setCustomMinutes(minutes)
    setIsRunning(false)
  }

  const applyCustomDuration = (minutes: number) => {
    const safeMinutes = Number.isFinite(minutes) ? Math.max(5, minutes) : 45
    const seconds = safeMinutes * 60
    setSelectedBlockId(null)
    setDurationSeconds(seconds)
    setTimeLeft(seconds)
    setCustomMinutes(safeMinutes)
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(durationSeconds)
  }

  const saveSession = async () => {
    const userId = session?.user.id
    if (!userId || elapsedSeconds <= 0) return

    setIsSaving(true)
    setSavedMessage(null)

    const { error } = await supabase.from('study_sessions').insert({
      user_id: userId,
      study_block_id: selectedBlock?.id ?? null,
      subject: resolvedSubject,
      duration_seconds: elapsedSeconds,
      completed_at: new Date().toISOString(),
    })

    if (error) {
      setSavedMessage(`No se pudo guardar: ${error.message}`)
      setIsSaving(false)
      return
    }

    setSavedMessage('Sesion guardada en tu historial de estudio')
    setIsSaving(false)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-purple-950">Modo enfoque</h1>
          <p className="text-sm text-purple-700">Temporizador para estudiar desde la PC y guardar tu avance</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/study" className="rounded-xl bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-900">
            Volver al horario
          </Link>
          <Link to="/study/history" className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-900">
            Ver historial
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-purple-200 bg-white p-5">
          <MochiCompanion
            mood={isRunning ? 'excited' : 'thinking'}
            title="Concentracion bonita"
            message="Tu progreso de hoy tambien cuenta desde web."
            className="mb-4"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-purple-800">Bloque planificado (opcional)</span>
              <select
                value={selectedBlockId ?? ''}
                onChange={(event) => {
                  const nextId = event.target.value || null
                  setSelectedBlockId(nextId)
                }}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              >
                <option value="">Sesion libre</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.subject} - {block.start_time} a {block.end_time}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-purple-800">Materia o foco</span>
              <input
                value={customSubject}
                onChange={(event) => setCustomSubject(event.target.value)}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
                placeholder="Ej: Fisica"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickDurations.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => applyQuickDuration(minutes)}
                className="rounded-xl bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900 hover:bg-purple-200"
              >
                {minutes} min
              </button>
            ))}
          </div>

          <div className="mt-3 max-w-[220px]">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase text-purple-800">Duracion personalizada (min)</span>
              <input
                type="number"
                min={5}
                value={customMinutes}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setCustomMinutes(value)
                  applyCustomDuration(value)
                }}
                className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-purple-200 bg-purple-50 p-5 text-center">
            <p className="text-sm font-semibold text-purple-700">{resolvedSubject}</p>
            <p className="mt-2 text-5xl font-black tracking-tight text-purple-950">{formatTimer(timeLeft)}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.max(0, progressPercent)}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold text-purple-600">
              Avance: {Math.round(100 - progressPercent)}%
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((running) => !running)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Reiniciar
            </button>
            <button
              type="button"
              onClick={() => {
                void saveSession()
              }}
              disabled={isSaving || elapsedSeconds <= 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar sesion'}
            </button>
          </div>

          {savedMessage ? <p className="mt-3 text-sm font-semibold text-purple-700">{savedMessage}</p> : null}
        </section>

        <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-lg font-bold text-blue-950">Atajos de estudio</h2>
          <p className="mt-1 text-sm text-blue-700">Funciones clave disponibles desde web</p>

          <div className="mt-4 space-y-2">
            <Link to="/study/new" className="block rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
              Crear bloque semanal
            </Link>
            <Link to="/study/history" className="block rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
              Revisar historial de sesiones
            </Link>
            <Link to="/study/exams" className="block rounded-2xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900">
              Registrar examenes
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-3">
            <p className="text-xs font-bold uppercase text-blue-700">Tiempo registrado hoy</p>
            <p className="mt-1 text-2xl font-black text-blue-950">{formatTimer(elapsedSeconds)}</p>
            <p className="mt-1 text-xs text-blue-700">Guarda al finalizar para sumar al historial.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
