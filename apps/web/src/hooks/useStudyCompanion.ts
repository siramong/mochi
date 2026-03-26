import { useMemo, useState } from 'react'
import { askStudyCompanion } from '@/lib/ai'

export interface StudyCompanionMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StudyAttachment {
  name: string
  mimeType: string
  base64: string
}

export function useStudyCompanion(subject: string, topic: string, discipline: string) {
  const [messages, setMessages] = useState<StudyCompanionMessage[]>([])
  const [attachment, setAttachment] = useState<StudyAttachment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMessages = useMemo(() => messages.length > 0, [messages.length])

  const ask = async (question: string) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return

    setLoading(true)
    setError(null)

    const nextMessages = [...messages, { role: 'user' as const, content: trimmedQuestion }]
    setMessages(nextMessages)

    try {
      const response = await askStudyCompanion(
        subject,
        topic,
        discipline,
        messages,
        trimmedQuestion,
        attachment?.base64,
        attachment?.mimeType
      )

      setMessages((prev) => [...prev, { role: 'assistant', content: response || 'No pude responder por ahora.' }])
      setAttachment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar a Mochi')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setMessages([])
    setAttachment(null)
    setError(null)
  }

  return { messages, attachment, setAttachment, loading, error, hasMessages, ask, clear }
}
