import OpenAI from 'openai'

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

const openrouter = new OpenAI({
  apiKey: OPENROUTER_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'mochi.siramong.tech',
    'X-Title': 'Mochi',
  },
  dangerouslyAllowBrowser: true,
})

type ChatRole = 'system' | 'user' | 'assistant'

type StudyHistoryMessage = { role: 'user' | 'assistant'; content: string }

function hasAttachment(base64?: string, mimeType?: string): boolean {
  return Boolean(base64 && mimeType)
}

function attachmentBlocks(text: string, base64: string, mimeType: string): unknown[] {
  if (mimeType === 'application/pdf') {
    return [
      { type: 'text', text },
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      },
    ]
  }

  if (mimeType.startsWith('image/')) {
    return [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
    ]
  }

  return [{ type: 'text', text }]
}

async function callMessages(
  messages: Array<{ role: ChatRole; content: unknown }>,
  model: string,
  maxTokens: number
): Promise<string> {
  if (!OPENROUTER_KEY) return ''

  const completion = await openrouter.chat.completions.create({
    model,
    // Los bloques multimodales no están completamente tipados en el SDK.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    max_tokens: maxTokens,
    temperature: 0.35,
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}

export async function detectStudyDiscipline(subject: string, topic: string): Promise<string> {
  const system =
    'Clasifica la disciplina principal y responde solo una frase corta en minúsculas en español.'
  const user = `Materia: ${subject}\nTema: ${topic}`

  const response = await callMessages(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    'nvidia/nemotron-3-super-120b-a12b:free',
    120
  )

  return response || 'estudio general'
}

export async function generateStudySessionPlan(
  subject: string,
  specificTopic: string,
  durationMinutes: number,
  discipline: string,
  attachmentBase64?: string,
  attachmentMimeType?: string
): Promise<string> {
  const systemPrompt = `Eres Mochi, mentora de estudio. Responde en español, máximo 120 palabras, sin emojis. Debes: 1) incluir una frase motivadora, 2) dar 2-3 tips concretos del tema, 3) proponer desglose de tiempo para la sesión. Ajusta técnicas a la disciplina y usa conceptos del adjunto si existe.`

  const userPrompt = `Materia: ${subject}\nTema: ${specificTopic}\nDuración: ${durationMinutes} minutos\nDisciplina: ${discipline}`

  if (!hasAttachment(attachmentBase64, attachmentMimeType)) {
    return (
      (await callMessages(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        'nvidia/nemotron-3-super-120b-a12b:free',
        360
      )) || 'No pude generar el plan por ahora.'
    )
  }

  try {
    return await callMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: attachmentBlocks(userPrompt, attachmentBase64!, attachmentMimeType!) },
      ],
      'google/gemini-2.0-flash-exp:free',
      360
    )
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined

    if (status === 429 || status === 503) {
      const fallback = await callMessages(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${userPrompt}\nNo se pudo procesar adjunto; responde usando solo texto.` },
        ],
        'nvidia/nemotron-3-super-120b-a12b:free',
        360
      )
      return `No pude procesar el archivo adjunto por saturación temporal. ${fallback}`.trim()
    }

    throw error
  }
}

export async function askStudyCompanion(
  subject: string,
  specificTopic: string,
  discipline: string,
  history: StudyHistoryMessage[],
  question: string,
  attachmentBase64?: string,
  attachmentMimeType?: string
): Promise<string> {
  const systemPrompt = `Eres Mochi, compañera de estudio. Responde máximo 150 palabras, en español y sin emojis. Contexto: ${subject} | ${specificTopic} | ${discipline}. Ayuda con teoría, resolución paso a paso, depuración de código, gramática/traducción, memorización y fórmulas.`

  const baseMessages: Array<{ role: ChatRole; content: unknown }> = [
    { role: 'system', content: systemPrompt },
    ...history.map((message) => ({ role: message.role, content: message.content })),
  ]

  if (!hasAttachment(attachmentBase64, attachmentMimeType)) {
    return (
      (await callMessages(
        [...baseMessages, { role: 'user', content: question }],
        'nvidia/nemotron-3-super-120b-a12b:free',
        420
      )) || 'No pude responder en este momento.'
    )
  }

  try {
    return await callMessages(
      [
        ...baseMessages,
        { role: 'user', content: attachmentBlocks(question, attachmentBase64!, attachmentMimeType!) },
      ],
      'google/gemini-2.0-flash-exp:free',
      420
    )
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined

    if (status === 429 || status === 503) {
      const fallback = await callMessages(
        [...baseMessages, { role: 'user', content: question }],
        'nvidia/nemotron-3-super-120b-a12b:free',
        420
      )
      return `No pude procesar el archivo adjunto por saturación temporal. ${fallback}`.trim()
    }

    throw error
  }
}
