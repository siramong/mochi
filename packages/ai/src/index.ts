import OpenAI from 'openai'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const TEXT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const MULTIMODAL_MODEL = 'google/gemini-2.0-flash-exp:free'
const FALLBACK_MODELS: AIModel[] = [TEXT_MODEL, MULTIMODAL_MODEL]

type ChatRole = 'system' | 'user' | 'assistant'

export type AIModel =
  | 'nvidia/nemotron-3-super-120b-a12b:free'
  | 'google/gemini-2.0-flash-exp:free'
  | (string & {})

export type AIErrorCode =
  | 'CONFIGURATION'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'EMPTY_RESPONSE'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'ALL_MODELS_UNAVAILABLE'
  | 'UNKNOWN'

export class AIError extends Error {
  code: AIErrorCode
  retryable: boolean
  status?: number
  model?: string
  cause?: unknown

  constructor(params: {
    code: AIErrorCode
    message: string
    retryable?: boolean
    status?: number
    model?: string
    cause?: unknown
  }) {
    super(params.message)
    this.name = 'AIError'
    this.code = params.code
    this.retryable = Boolean(params.retryable)
    this.status = params.status
    this.model = params.model
    this.cause = params.cause
  }
}

export interface ChatMessage {
  role: ChatRole
  content: unknown
}

export interface CallAIOptions {
  model?: string
  maxTokens?: number
}

export interface AITextRequest {
  systemPrompt: string
  userMessage: string
  model?: AIModel
  maxTokens?: number
  temperature?: number
}

export interface AITextWithFallbackRequest extends AITextRequest {
  models?: AIModel[]
}

export interface AIJsonParseOptions {
  expected?: 'object' | 'array' | 'auto'
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

export interface StudyBlockSuggestion {
  subject: string
  day_of_week: number
  start_time: string
  end_time: string
  reason: string
}

export interface StudyBlockSuggestionParams {
  context: string
}

export interface StudySessionPlanParams {
  subject: string
  topic: string
  durationMinutes: number
  discipline: string
  attachmentBase64?: string
  attachmentMimeType?: string
}

export interface StudyCompanionParams {
  subject: string
  topic: string
  discipline: string
  history: StudyHistoryMessage[]
  question: string
  attachmentBase64?: string
  attachmentMimeType?: string
}

export interface MochiAIContract {
  callAI(prompt: string, options?: CallAIOptions): Promise<string>
  callAIText(params: AITextRequest): Promise<string>
  callAIWithFallback(params: AITextWithFallbackRequest): Promise<string>
  callAIWithMessages(messages: ChatMessage[], model?: string): Promise<string>
  detectStudyDiscipline(subject: string, topic: string): Promise<string>
  generateStudySessionPlan(
    subject: string,
    topic: string,
    durationMinutes: number,
    discipline: string,
    attachmentBase64?: string,
    attachmentMimeType?: string
  ): Promise<string>
  askStudyCompanion(
    subject: string,
    topic: string,
    discipline: string,
    history: StudyHistoryMessage[],
    question: string,
    attachmentBase64?: string,
    attachmentMimeType?: string
  ): Promise<string>
  askMochiWhileCooking(recipeTitle: string, currentStepTitle: string, question: string): Promise<string>
  generateRecipe(
    userPrompt: string,
    options: RecipeGenerationOptions,
    cyclePhaseLabel?: string
  ): Promise<AIRecipeResponse>
  generateFlashcards(subject: string, topic: string, count?: number): Promise<FlashcardPair[]>
  generateStudyBlockSuggestions(params: StudyBlockSuggestionParams): Promise<StudyBlockSuggestion[]>
}

function hasAttachment(base64?: string, mimeType?: string): boolean {
  return Boolean(base64 && mimeType)
}

function normalizeError(error: unknown, model?: string): AIError {
  if (error instanceof AIError) {
    return error
  }

  const status =
    typeof error === 'object' && error && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined
  const message = error instanceof Error ? error.message : 'Error desconocido de IA'
  const normalized = message.toLowerCase()

  if (status === 429 || normalized.includes('rate')) {
    return new AIError({
      code: 'RATE_LIMIT',
      message: 'Límite de peticiones de IA alcanzado temporalmente.',
      retryable: true,
      status,
      model,
      cause: error,
    })
  }

  if (status === 408 || normalized.includes('timeout')) {
    return new AIError({
      code: 'TIMEOUT',
      message: 'La respuesta de IA tardó demasiado. Intenta nuevamente.',
      retryable: true,
      status,
      model,
      cause: error,
    })
  }

  if (normalized.includes('network') || normalized.includes('fetch')) {
    return new AIError({
      code: 'NETWORK',
      message: 'No fue posible conectar con el proveedor de IA.',
      retryable: true,
      status,
      model,
      cause: error,
    })
  }

  if (typeof status === 'number') {
    return new AIError({
      code: 'API_ERROR',
      message: `Error del proveedor de IA (status ${status}).`,
      retryable: status >= 500 || status === 503,
      status,
      model,
      cause: error,
    })
  }

  return new AIError({
    code: 'UNKNOWN',
    message: 'Ocurrió un error inesperado al llamar la IA.',
    retryable: false,
    model,
    cause: error,
  })
}

function stripCodeFences(raw: string): string {
  return raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
}

function extractJsonSpan(raw: string, expected: 'object' | 'array' | 'auto'): string {
  const cleaned = stripCodeFences(raw)
  if (!cleaned) {
    throw new AIError({ code: 'PARSE_ERROR', message: 'La respuesta de IA está vacía.' })
  }

  if (expected === 'array') {
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1 || end <= start) {
      throw new AIError({ code: 'PARSE_ERROR', message: 'No se encontró un array JSON válido.' })
    }
    return cleaned.slice(start, end + 1)
  }

  if (expected === 'object') {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new AIError({ code: 'PARSE_ERROR', message: 'No se encontró un objeto JSON válido.' })
    }
    return cleaned.slice(start, end + 1)
  }

  const objectStart = cleaned.indexOf('{')
  const arrayStart = cleaned.indexOf('[')
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    return extractJsonSpan(cleaned, 'array')
  }

  return extractJsonSpan(cleaned, 'object')
}

export function parseAIJson<T>(raw: string, options?: AIJsonParseOptions): T {
  try {
    const span = extractJsonSpan(raw, options?.expected ?? 'auto')
    return JSON.parse(span) as T
  } catch (error) {
    if (error instanceof AIError) {
      throw error
    }

    throw new AIError({
      code: 'PARSE_ERROR',
      message: 'No se pudo parsear la respuesta JSON de la IA.',
      cause: error,
    })
  }
}

function isLikelyTruncatedJson(raw: string): boolean {
  const clean = stripCodeFences(raw)
  if (!clean) return false

  const openBraces = (clean.match(/\{/g) ?? []).length
  const closeBraces = (clean.match(/\}/g) ?? []).length
  const openBrackets = (clean.match(/\[/g) ?? []).length
  const closeBrackets = (clean.match(/\]/g) ?? []).length

  const hasUnbalancedDelimiters = openBraces > closeBraces || openBrackets > closeBrackets
  const endsAbruptly = !/[}\]"\n]$/.test(clean)

  return hasUnbalancedDelimiters || endsAbruptly
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

function parseRecipeResponse(raw: string): AIRecipeResponse {
  const parsed = parseAIJson<AIRecipeResponse>(raw, { expected: 'object' })

  if (!parsed.title || !Array.isArray(parsed.steps) || !Array.isArray(parsed.ingredients)) {
    throw new AIError({
      code: 'VALIDATION_ERROR',
      message: 'La receta devuelta por IA no tiene la estructura esperada.',
    })
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

function buildClient(openrouter: OpenAI): MochiAIContract {
  async function callAIText(params: AITextRequest): Promise<string> {
    try {
      const completion = await openrouter.chat.completions.create({
        model: params.model ?? TEXT_MODEL,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userMessage },
        ],
        max_tokens: params.maxTokens ?? 2048,
        temperature: params.temperature ?? 0.35,
      })

      const content = completion.choices[0]?.message?.content?.trim() ?? ''
      if (!content) {
        throw new AIError({
          code: 'EMPTY_RESPONSE',
          message: 'La IA respondió sin contenido.',
          model: params.model,
          retryable: true,
        })
      }

      return content
    } catch (error) {
      throw normalizeError(error, params.model)
    }
  }

  async function callAIWithFallback(params: AITextWithFallbackRequest): Promise<string> {
    const models = params.models?.length ? params.models : FALLBACK_MODELS
    let lastError: AIError | null = null

    for (const model of models) {
      try {
        return await callAIText({
          ...params,
          model,
        })
      } catch (error) {
        const normalized = normalizeError(error, model)
        lastError = normalized

        if (!normalized.retryable) {
          throw normalized
        }

        if (normalized.code === 'NETWORK' || normalized.code === 'TIMEOUT') {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          try {
            return await callAIText({ ...params, model })
          } catch (retryError) {
            lastError = normalizeError(retryError, model)
          }
        }
      }
    }

    throw new AIError({
      code: 'ALL_MODELS_UNAVAILABLE',
      message: 'Todos los modelos de IA están temporalmente no disponibles. Intenta más tarde.',
      retryable: true,
      cause: lastError,
    })
  }

  async function callAI(prompt: string, options?: CallAIOptions): Promise<string> {
    return callAIWithFallback({
      systemPrompt:
        'Eres asistente de Mochi. Responde siempre en español. Si te piden JSON, devuelve solo JSON válido sin markdown ni texto extra.',
      userMessage: prompt,
      model: options?.model,
      maxTokens: options?.maxTokens ?? 8192,
      models: options?.model ? [options.model] : undefined,
      temperature: 0.4,
    })
  }

  async function callAIWithMessages(messages: ChatMessage[], model = TEXT_MODEL): Promise<string> {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: messages as any,
        max_tokens: 1024,
        temperature: 0.35,
      })

      return completion.choices[0]?.message?.content?.trim() ?? ''
    } catch (error) {
      throw normalizeError(error, model)
    }
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
      const text = await callAIWithFallback({
        systemPrompt,
        userMessage: userPrompt,
        maxTokens: 2048,
        models: [TEXT_MODEL, MULTIMODAL_MODEL],
      })

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
      const normalized = normalizeError(error, MULTIMODAL_MODEL)
      if (!normalized.retryable) {
        throw normalized
      }

      const fallback = await callAIWithFallback({
        systemPrompt,
        userMessage: `${userPrompt}\nNo se pudo procesar adjunto; responde usando solo texto.`,
        maxTokens: 2048,
        models: [TEXT_MODEL],
      })

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
      const normalized = normalizeError(error, MULTIMODAL_MODEL)
      if (!normalized.retryable) {
        throw normalized
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
    const response = await callAIWithFallback({
      systemPrompt:
        'Eres Mochi, una asistente de cocina cálida. Responde de forma breve, útil y siempre en español.',
      userMessage: `La usuaria está preparando "${recipeTitle}" y está en el paso "${currentStepTitle}". Tiene esta pregunta: "${question}". Responde máximo 3 oraciones.`,
      maxTokens: 220,
      models: [TEXT_MODEL, MULTIMODAL_MODEL],
    })

    return response || 'No pude responder ahora, pero sigue con confianza.'
  }

  async function generateRecipe(
    userPrompt: string,
    options: RecipeGenerationOptions,
    cyclePhaseLabel?: string
  ): Promise<AIRecipeResponse> {
    const prompt = buildRecipePrompt(userPrompt, options, cyclePhaseLabel)
    const response = await callAI(prompt, { maxTokens: 8192 })

    try {
      return parseRecipeResponse(response)
    } catch {
      try {
        if (isLikelyTruncatedJson(response)) {
          const completed = await callAI(
            `Completa este JSON truncado y devuelve SOLO un JSON valido, sin markdown ni texto adicional. Debes respetar exactamente: servings=${options.servings}, difficulty=${options.complexity}, tipo=${options.recipeType}. JSON truncado:\n\n${response}`,
            { maxTokens: 8192 }
          )
          return parseRecipeResponse(completed)
        }

        const repaired = await callAI(
          `Corrige y devuelve SOLO un JSON valido, sin texto adicional, usando exactamente la estructura solicitada. Mantén estos valores obligatorios: servings=${options.servings}, difficulty=${options.complexity}, tipo=${options.recipeType}. Respuesta original:\n\n${response}`,
          { maxTokens: 8192 }
        )
        return parseRecipeResponse(repaired)
      } catch (error) {
        throw new AIError({
          code: 'PARSE_ERROR',
          message: 'No pude entender la receta generada por la IA. Intenta de nuevo.',
          cause: error,
        })
      }
    }
  }

  async function generateFlashcards(
    subject: string,
    topic: string,
    count: number = 8
  ): Promise<FlashcardPair[]> {
    const response = await callAI(
      `Eres Mochi, asistente de estudio. Genera exactamente ${count} flashcards de estudio para:
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
- Todo en español`,
      { maxTokens: 4096 }
    )

    let parsed: FlashcardPair[]

    try {
      parsed = parseAIJson<FlashcardPair[]>(response, { expected: 'array' })
    } catch {
      const repaired = await callAI(
        `Corrige y devuelve SOLO un array JSON válido de flashcards, sin texto adicional:\n\n${response}`,
        { maxTokens: 4096 }
      )
      parsed = parseAIJson<FlashcardPair[]>(repaired, { expected: 'array' })
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new AIError({
        code: 'VALIDATION_ERROR',
        message: 'No se pudieron generar flashcards válidas.',
      })
    }

    return parsed.slice(0, count).map((item) => ({
      front: String(item.front ?? '').trim(),
      back: String(item.back ?? '').trim(),
    }))
  }

  async function generateStudyBlockSuggestions(
    params: StudyBlockSuggestionParams
  ): Promise<StudyBlockSuggestion[]> {
    const response = await callAIWithFallback({
      systemPrompt:
        'Eres un planificador académico experto de Mochi. Responde siempre en español y ÚNICAMENTE con JSON válido sin texto adicional.',
      userMessage: `Analiza este contexto de horario y sugiere bloques de estudio óptimos.\n\nContexto:\n${params.context}\n\nFormato exacto requerido:\n[{"subject":"string","day_of_week":1,"start_time":"HH:MM","end_time":"HH:MM","reason":"string"}]`,
      maxTokens: 4096,
      models: [TEXT_MODEL, MULTIMODAL_MODEL],
    })

    const parsed = parseAIJson<StudyBlockSuggestion[]>(response, { expected: 'array' })
    if (!Array.isArray(parsed)) {
      throw new AIError({
        code: 'VALIDATION_ERROR',
        message: 'La sugerencia de bloques de estudio no es válida.',
      })
    }

    return parsed
  }

  return {
    callAI,
    callAIText,
    callAIWithFallback,
    callAIWithMessages,
    detectStudyDiscipline,
    generateStudySessionPlan,
    askStudyCompanion,
    askMochiWhileCooking,
    generateRecipe,
    generateFlashcards,
    generateStudyBlockSuggestions,
  }
}

type AIClient = MochiAIContract

let activeClient: AIClient | null = null

function requireClient(): AIClient {
  if (!activeClient) {
    throw new AIError({
      code: 'CONFIGURATION',
      message: 'Cliente de IA no configurado. Usa createAIClient(apiKey) antes de llamar funciones.',
    })
  }

  return activeClient
}

export function createAIClient(apiKey: string): AIClient {
  if (!apiKey.trim()) {
    throw new AIError({
      code: 'CONFIGURATION',
      message: 'La API key de OpenRouter es requerida.',
    })
  }

  activeClient = buildClient(createOpenRouter(apiKey))
  return activeClient
}

export function getAIClient(): AIClient {
  return requireClient()
}

export async function callAI(prompt: string, options?: CallAIOptions): Promise<string> {
  return requireClient().callAI(prompt, options)
}

export async function callAIText(params: AITextRequest): Promise<string> {
  return requireClient().callAIText(params)
}

export async function callAIWithFallback(params: AITextWithFallbackRequest): Promise<string> {
  return requireClient().callAIWithFallback(params)
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

export async function generateStudyBlockSuggestions(
  params: StudyBlockSuggestionParams
): Promise<StudyBlockSuggestion[]> {
  return requireClient().generateStudyBlockSuggestions(params)
}
