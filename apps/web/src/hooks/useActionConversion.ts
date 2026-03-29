import { useState } from 'react'
import { AIError, convertNoteToAction } from '@mochi/ai'

export interface ActionConversionResult {
  type: 'study_block' | 'exercise' | 'goal' | 'habit'
  confidence: number
  data: {
    title?: string
    duration?: number
    description?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }
  reasoning: string
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('La solicitud a la IA tardó demasiado.'))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

function toSpanishError(err: unknown): Error {
  if (err instanceof Error) {
    const message = err.message.toLowerCase()

    if (message.includes('timeout') || message.includes('tardó demasiado')) {
      return new Error('La solicitud a la IA tardó demasiado. Intenta nuevamente.')
    }

    if (message.includes('failed') || message.includes('error')) {
      return new Error('No se pudo convertir la nota en una acción.')
    }
  }

  return new Error('Ocurrió un error al convertir la nota.')
}

function normalizeType(type: 'study' | 'exercise' | 'goal' | 'habit'): ActionConversionResult['type'] {
  if (type === 'study') {
    return 'study_block'
  }

  return type
}

function mapResultToActionConversion(result: NonNullable<Awaited<ReturnType<typeof convertNoteToAction>>>): ActionConversionResult {
  return {
    type: normalizeType(result.type),
    confidence: result.confidence,
    data: {
      title: result.data?.title,
      duration: result.data?.durationMinutes,
      description: result.data?.description,
      difficulty: result.data?.difficulty,
    },
    reasoning: result.reasoning || '',
  }
}

export function useActionConversion() {
  const [convertingNote, setConvertingNote] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const convertNote = async (note: string): Promise<ActionConversionResult | null> => {
    setConvertingNote(true)
    setError(null)

    const payloadNote = `Contexto: student_productivity_web. Idioma requerido: español. Nota: ${note}`

    try {
      const result = await withTimeout(
        convertNoteToAction({
          note: payloadNote,
          context: {
            currentGoals: ['student_productivity_web'],
          },
        }),
        15000
      )

      if (!result) {
        setError(new Error('No se pudo convertir la nota en una acción.'))
        return null
      }

      return mapResultToActionConversion(result)
    } catch (err) {
      if (err instanceof AIError && err.retryable) {
        try {
          const retryResult = await withTimeout(
            convertNoteToAction({
              note: payloadNote,
              context: {
                currentGoals: ['student_productivity_web'],
              },
            }),
            15000
          )

          if (!retryResult) {
            const nullRetryError = new Error('No se pudo convertir la nota en una acción tras reintentar.')
            setError(nullRetryError)
            return null
          }

          return mapResultToActionConversion(retryResult)
        } catch (retryErr) {
          const retryError = toSpanishError(retryErr)
          setError(retryError)
          console.error('[useActionConversion] Error en reintento:', retryError)
          return null
        }
      }

      const conversionError = toSpanishError(err)
      setError(conversionError)
      console.error('[useActionConversion] Error de conversion:', conversionError)
      return null
    } finally {
      setConvertingNote(false)
    }
  }

  return { convertNote, convertingNote, error }
}
