import OpenAI from 'openai'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const TEXT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const MULTIMODAL_MODEL = 'google/gemini-2.0-flash-exp:free'

type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: unknown
}

export interface CallAIOptions {
  model?: string
  maxTokens?: number
}

export type StudyHistoryMessage = { role: 'user' | 'assistant'; content: string }
export type RecipeGenerationType = 'normal' | 'keto' | 'vegetariana' | 'vegana' | 'alta_proteina'
export type RecipeDifficulty = 'fácil' | 'media' | 'difícil'

export interface RecipeGenerationOptions {
  recipeType: RecipeGenerationType
  servings: number
  complexity: RecipeDifficulty
}

export interface AIRecipeResponse {
  title: string
  description: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  difficulty: RecipeDifficulty
  cuisine_type: string
  tags: string[]
  ingredients: Array<{
    name: string
    amount: number | null
    unit: string | null
    notes: string | null
  }>
  steps: Array<{
    step_number: number
    title: string
    instructions: string
    duration_seconds: number | null
    temperature: string | null
    tip: string | null
  }>
}

export interface FlashcardPair {
  front: string
  back: string
}

function hasAttachment(base64?: string, mimeType?: string): boolean {
  return Boolean(base64 && mimeType)
}

function isFallbackStatus(error: unknown): boolean {
  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined

  return status === 429 || status === 503
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

function extractJsonObject(raw: string): string {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No se encontró un objeto JSON en la respuesta')
  }

  return clean.slice(firstBrace, lastBrace + 1)
}

function isLikelyTruncatedJson(raw: string): boolean {
  const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  if (!clean) return false

  const openBraces = (clean.match(/\{/g) ?? []).length
  const closeBraces = (clean.match(/\}/g) ?? []).length
  const openBrackets = (clean.match(/\[/g) ?? []).length
  const closeBrackets = (clean.match(/\]/g) ?? []).length

  const hasUnbalancedDelimiters = openBraces > closeBraces || openBrackets > closeBrackets
  const endsAbruptly = !/[}\]"\n]$/.test(clean)

  return hasUnbalancedDelimiters || endsAbruptly
}

function parseRecipeResponse(raw: string): AIRecipeResponse {
  const parsed = JSON.parse(extractJsonObject(raw)) as AIRecipeResponse

  if (!parsed.title || !Array.isArray(parsed.steps) || !Array.isArray(parsed.ingredients)) {
    throw new Error('Respuesta de IA incompleta')
  }

  const validDifficulties: RecipeDifficulty[] = ['fácil', 'media', 'difícil']
  if (!validDifficulties.includes(parsed.difficulty)) {
    parsed.difficulty = 'media'
  }

  return parsed
}

function buildRecipePrompt(
  userPrompt: string,
  options: RecipeGenerationOptions,
  cyclePhaseLabel?: string
): string {
  const recipeTypeText: Record<RecipeGenerationType, string> = {
    normal: 'Normal (sin restriccion especial)',
    keto: 'Keto (baja en carbohidratos)',
    vegetariana: 'Vegetariana (sin carne ni pescado)',
    vegana: 'Vegana (sin ingredientes de origen animal)',
    alta_proteina: 'Alta en proteina',
  }

  const cycleHint = cyclePhaseLabel
    ? `\nContexto adicional de bienestar:\n- La usuaria está en su ${cyclePhaseLabel}. Si es apropiado, sugiere ingredientes o preparaciones que beneficien su bienestar en esta fase, sin dar consejos médicos.`
    : ''

  return `Eres Mochi, una asistente de cocina experta. Una estudiante te pide:

"${userPrompt}"

Configuracion obligatoria para esta receta:
- Tipo de receta: ${recipeTypeText[options.recipeType]}
- Cantidad de personas: ${options.servings}
- Nivel de complejidad: ${options.complexity}
${cycleHint}

Genera una receta detallada, realista y deliciosa en español. Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin bloques de código) con esta estructura exacta:

{
  "title": "Nombre de la receta",
  "description": "Descripción apetitosa de 1-2 oraciones",
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "servings": ${options.servings},
  "difficulty": "${options.complexity}",
  "cuisine_type": "mexicana",
  "tags": ["vegetariana", "rápida"],
  "ingredients": [
    {
      "name": "champiñones",
      "amount": 200,
      "unit": "g",
      "notes": "rebanados"
    },
    {
      "name": "sal",
      "amount": null,
      "unit": null,
      "notes": "al gusto"
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "title": "Preparar los champiñones",
      "instructions": "Limpia los champiñones con un paño húmedo y córtalos en rebanadas de medio centímetro.",
      "duration_seconds": 180,
      "temperature": null,
      "tip": "No los laves bajo el agua o absorberán humedad y no dorarán bien."
    }
  ]
}

Reglas:
- difficulty debe ser exactamente: "fácil", "media" o "difícil" y debe coincidir con el nivel solicitado
- servings debe ser exactamente ${options.servings}
- Ajusta ingredientes y porciones para ${options.servings} personas
- Respeta estrictamente el tipo de receta solicitado
- duration_seconds en los pasos: usa null si es un paso manual sin tiempo fijo
- Los pasos deben ser suficientemente detallados para que alguien sin experiencia los siga
- Máximo 12 ingredientes y 10 pasos
- Los tips deben ser consejos prácticos y útiles`
}

function createOpenRouter(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': 'mochi.siramong.tech',
      'X-Title': 'Mochi',
    },
    dangerouslyAllowBrowser: true,
  })
}

function buildClient(openrouter: OpenAI) {
  async function callAI(prompt: string, options?: CallAIOptions): Promise<string> {
    const completion = await openrouter.chat.completions.create({
      model: options?.model ?? TEXT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Responde siempre en español. Si te piden JSON, devuelve solo JSON válido, sin markdown ni texto extra.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens ?? 8192,
      temperature: 0.4,
    })

    return completion.choices[0]?.message?.content?.trim() ?? ''
  }

  async function callAIWithMessages(messages: ChatMessage[], model = TEXT_MODEL): Promise<string> {
    const completion = await openrouter.chat.completions.create({
      model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      max_tokens: 512,
      temperature: 0.35,
    })

    return completion.choices[0]?.message?.content?.trim() ?? ''
  }

  async function detectStudyDiscipline(subject: string, topic: string): Promise<string> {
    const response = await callAIWithMessages(
      [
        {
          role: 'system',
          content:
            'Clasifica la disciplina principal y responde solo una frase corta en minúsculas en español.',
        },
        { role: 'user', content: `Materia: ${subject}\nTema: ${topic}` },
      ],
      TEXT_MODEL
    )

    return response || 'estudio general'
  }

  async function generateStudySessionPlan(
    subject: string,
    topic: string,
    durationMinutes: number,
    discipline: string,
    attachmentBase64?: string,
    attachmentMimeType?: string
  ): Promise<string> {
    const systemPrompt =
      'Eres Mochi, mentora de estudio. Responde en español, máximo 120 palabras, sin emojis. Debes: 1) incluir una frase motivadora, 2) dar 2-3 tips concretos del tema, 3) proponer desglose de tiempo para la sesión. Ajusta técnicas a la disciplina y usa conceptos del adjunto si existe.'

    const userPrompt = `Materia: ${subject}\nTema: ${topic}\nDuración: ${durationMinutes} minutos\nDisciplina: ${discipline}`

    if (!hasAttachment(attachmentBase64, attachmentMimeType)) {
      const text = await callAIWithMessages(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        TEXT_MODEL
      )

      return text || 'No pude generar el plan por ahora.'
    }

    try {
      const multimodalText = await callAIWithMessages(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: attachmentBlocks(userPrompt, attachmentBase64!, attachmentMimeType!) },
        ],
        MULTIMODAL_MODEL
      )
      return multimodalText || 'No pude generar el plan por ahora.'
    } catch (error) {
      if (!isFallbackStatus(error)) {
        throw error
      }

      const fallback = await callAIWithMessages(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${userPrompt}\nNo se pudo procesar adjunto; responde usando solo texto.`,
          },
        ],
        TEXT_MODEL
      )

      return `No pude procesar el archivo adjunto por saturación temporal. ${fallback}`.trim()
    }
  }

  async function askStudyCompanion(
    subject: string,
    topic: string,
    discipline: string,
    history: StudyHistoryMessage[],
    question: string,
    attachmentBase64?: string,
    attachmentMimeType?: string
  ): Promise<string> {
    const systemPrompt = `Eres Mochi, compañera de estudio. Responde máximo 150 palabras, en español y sin emojis. Contexto: ${subject} | ${topic} | ${discipline}. Ayuda con teoría, resolución paso a paso, depuración de código, gramática/traducción, memorización y fórmulas.`

    const baseMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((message) => ({ role: message.role, content: message.content })),
    ]

    if (!hasAttachment(attachmentBase64, attachmentMimeType)) {
      const text = await callAIWithMessages(
        [...baseMessages, { role: 'user', content: question }],
        TEXT_MODEL
      )
      return text || 'No pude responder en este momento.'
    }

    try {
      const multimodalText = await callAIWithMessages(
        [
          ...baseMessages,
          { role: 'user', content: attachmentBlocks(question, attachmentBase64!, attachmentMimeType!) },
        ],
        MULTIMODAL_MODEL
      )
      return multimodalText || 'No pude responder en este momento.'
    } catch (error) {
      if (!isFallbackStatus(error)) {
        throw error
      }

      const fallback = await callAIWithMessages(
        [...baseMessages, { role: 'user', content: question }],
        TEXT_MODEL
      )
      return `No pude procesar el archivo adjunto por saturación temporal. ${fallback}`.trim()
    }
  }

  async function askMochiWhileCooking(
    recipeTitle: string,
    currentStepTitle: string,
    question: string
  ): Promise<string> {
    const prompt = `Eres Mochi, una asistente de cocina cálida. La usuaria está preparando "${recipeTitle}" y está en el paso "${currentStepTitle}". Tiene esta pregunta: "${question}". Responde de forma breve (máximo 3 oraciones), útil y en español.`

    const response = await callAI(prompt, { model: TEXT_MODEL, maxTokens: 220 })
    return response || 'No pude responder ahora, pero sigue con confianza.'
  }

  async function generateRecipe(
    userPrompt: string,
    options: RecipeGenerationOptions,
    cyclePhaseLabel?: string
  ): Promise<AIRecipeResponse> {
    const prompt = buildRecipePrompt(userPrompt, options, cyclePhaseLabel)
    const response = await callAI(prompt)

    try {
      return parseRecipeResponse(response)
    } catch (firstError) {
      try {
        if (isLikelyTruncatedJson(response)) {
          const completePrompt = `Completa este JSON truncado y devuelve SOLO un JSON valido, sin markdown ni texto adicional. Debes respetar exactamente: servings=${options.servings}, difficulty=${options.complexity}, tipo=${options.recipeType}. JSON truncado:\n\n${response}`
          const completed = await callAI(completePrompt)
          return parseRecipeResponse(completed)
        }

        const repairPrompt = `Corrige y devuelve SOLO un JSON valido, sin texto adicional, usando exactamente la estructura solicitada. Mantén estos valores obligatorios: servings=${options.servings}, difficulty=${options.complexity}, tipo=${options.recipeType}. Respuesta original:\n\n${response}`
        const repaired = await callAI(repairPrompt)
        return parseRecipeResponse(repaired)
      } catch (secondError) {
        console.error('Error parseando receta de IA:', firstError, secondError, '\nRespuesta raw:', response)
        throw new Error('No pude entender la respuesta de la IA. Intenta de nuevo.')
      }
    }
  }

  async function generateFlashcards(
    subject: string,
    topic: string,
    count: number = 8
  ): Promise<FlashcardPair[]> {
    const prompt = `Eres Mochi, asistente de estudio. Genera exactamente ${count} flashcards de estudio para:
Materia: ${subject}
Tema específico: ${topic}

Responde ÚNICAMENTE con un array JSON válido, sin markdown ni texto extra:
[
  { "front": "¿Pregunta o concepto?", "back": "Respuesta o definición clara" }
]

Reglas:
- Las preguntas deben ser específicas y concretas
- Las respuestas deben ser concisas (máximo 2 oraciones)
- Varía el tipo: definiciones, fórmulas, ejemplos, comparaciones
- Todo en español`

    const response = await callAI(prompt, { maxTokens: 1600 })
    const clean = response.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean) as FlashcardPair[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('No se pudieron generar flashcards válidas')
    }

    return parsed.slice(0, count).map((item) => ({
      front: String(item.front ?? '').trim(),
      back: String(item.back ?? '').trim(),
    }))
  }

  return {
    callAI,
    callAIWithMessages,
    detectStudyDiscipline,
    generateStudySessionPlan,
    askStudyCompanion,
    askMochiWhileCooking,
    generateRecipe,
    generateFlashcards,
  }
}

type AIClient = ReturnType<typeof buildClient>

let activeClient: AIClient | null = null

function requireClient(): AIClient {
  if (!activeClient) {
    throw new Error('Cliente de IA no configurado. Usa createAIClient(apiKey) antes de llamar funciones.')
  }

  return activeClient
}

export function createAIClient(apiKey: string): AIClient {
  if (!apiKey.trim()) {
    throw new Error('La API key de OpenRouter es requerida')
  }

  activeClient = buildClient(createOpenRouter(apiKey))
  return activeClient
}

export async function callAI(prompt: string, options?: CallAIOptions): Promise<string> {
  return requireClient().callAI(prompt, options)
}

export async function callAIWithMessages(messages: ChatMessage[], model?: string): Promise<string> {
  return requireClient().callAIWithMessages(messages, model)
}

export async function detectStudyDiscipline(subject: string, topic: string): Promise<string> {
  return requireClient().detectStudyDiscipline(subject, topic)
}

export async function generateStudySessionPlan(
  subject: string,
  topic: string,
  durationMinutes: number,
  discipline: string,
  attachmentBase64?: string,
  attachmentMimeType?: string
): Promise<string> {
  return requireClient().generateStudySessionPlan(
    subject,
    topic,
    durationMinutes,
    discipline,
    attachmentBase64,
    attachmentMimeType
  )
}

export async function askStudyCompanion(
  subject: string,
  topic: string,
  discipline: string,
  history: StudyHistoryMessage[],
  question: string,
  attachmentBase64?: string,
  attachmentMimeType?: string
): Promise<string> {
  return requireClient().askStudyCompanion(
    subject,
    topic,
    discipline,
    history,
    question,
    attachmentBase64,
    attachmentMimeType
  )
}

export async function askMochiWhileCooking(
  recipeTitle: string,
  currentStepTitle: string,
  question: string
): Promise<string> {
  return requireClient().askMochiWhileCooking(recipeTitle, currentStepTitle, question)
}

export async function generateRecipe(
  userPrompt: string,
  options: RecipeGenerationOptions,
  cyclePhaseLabel?: string
): Promise<AIRecipeResponse> {
  return requireClient().generateRecipe(userPrompt, options, cyclePhaseLabel)
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  count: number = 8
): Promise<FlashcardPair[]> {
  return requireClient().generateFlashcards(subject, topic, count)
}
