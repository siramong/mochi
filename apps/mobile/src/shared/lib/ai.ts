import AsyncStorage from '@react-native-async-storage/async-storage'
import OpenAI from 'openai'
import type { AIRecipeResponse, RecipeDifficulty } from '@/src/shared/types/database'

export interface AISuggestion {
  description: string
  estimatedDuration?: number // en segundos
  difficulty?: 'fácil' | 'medio' | 'difícil'
}

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || ''

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'mochi.siramong.tech',
    'X-Title': 'Mochi',
  },
  dangerouslyAllowBrowser: true,
})

type ChatRole = 'system' | 'user' | 'assistant'

type StudyHistoryMessage = { role: 'user' | 'assistant'; content: string }

function isMultimodalAttachment(mimeType?: string, base64?: string): boolean {
  return Boolean(mimeType && base64)
}

function isPdfMimeType(mimeType: string): boolean {
  return mimeType.toLowerCase() === 'application/pdf'
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith('image/')
}

async function callOpenRouterMessages(
  messages: Array<{ role: ChatRole; content: unknown }>,
  model: string,
  maxTokens: number,
  temperature = 0.4
): Promise<string> {
  if (!OPENROUTER_KEY) return ''

  const completion = await openrouter.chat.completions.create({
    model,
    // OpenRouter para Gemini requiere bloques multimodales que no están tipados completamente en openai SDK.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: messages as any,
    max_tokens: maxTokens,
    temperature,
  })

  return completion.choices[0]?.message?.content ?? ''
}

function getAttachmentBlocks(text: string, attachmentBase64: string, attachmentMimeType: string): unknown[] {
  if (isPdfMimeType(attachmentMimeType)) {
    return [
      { type: 'text', text },
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: attachmentBase64,
        },
      },
    ]
  }

  if (isImageMimeType(attachmentMimeType)) {
    return [
      { type: 'text', text },
      {
        type: 'image_url',
        image_url: {
          url: `data:${attachmentMimeType};base64,${attachmentBase64}`,
        },
      },
    ]
  }

  return [{ type: 'text', text }]
}

async function callStudyModel(
  systemPrompt: string,
  userText: string,
  attachmentBase64?: string,
  attachmentMimeType?: string,
  maxTokens = 512
): Promise<string> {
  const hasAttachment = isMultimodalAttachment(attachmentMimeType, attachmentBase64)

  if (!hasAttachment) {
    return callOpenRouterMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      'nvidia/nemotron-3-super-120b-a12b:free',
      maxTokens,
      0.35
    )
  }

  try {
    const multimodalContent = getAttachmentBlocks(userText, attachmentBase64!, attachmentMimeType!)
    return await callOpenRouterMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: multimodalContent },
      ],
      'google/gemini-2.0-flash-exp:free',
      maxTokens,
      0.35
    )
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined

    if (status === 429 || status === 503) {
      const fallback = await callOpenRouterMessages(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${userText}\n\nNota: no se pudo adjuntar el archivo en esta solicitud. Responde con el contexto de texto disponible.`,
          },
        ],
        'nvidia/nemotron-3-super-120b-a12b:free',
        maxTokens,
        0.35
      )
      return `No pude procesar el archivo adjunto por alta demanda en el modelo multimodal. ${fallback}`.trim()
    }

    throw error
  }
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_KEY) return ''

  try {
    const completion = await openrouter.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [
        {
          role: 'system',
          content:
            'Responde siempre en español. Si te piden JSON, devuelve solo JSON válido, sin markdown ni texto extra.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.4,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    console.log('🟢 OpenRouter OK:', text.slice(0, 80))
    return text
  } catch (error) {
    console.error('🔴 OpenRouter error:', error)
    return ''
  }
}

async function callAI(prompt: string): Promise<string> {
  if (OPENROUTER_KEY) {
    const result = await callOpenRouter(prompt)
    if (result) return result
  }

  return ''
}

function sanitizeDailyMotivationMessage(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text) return ''

  // Evita saludos redundantes en el dashboard y limpia menciones genéricas en inglés.
  const withoutGreeting = text.replace(
    /^(?:¡?hola(?:\s+[\p{L}\p{M}'-]+)?!?|buen(?:os|as)?\s+d[ií]as(?:\s+[\p{L}\p{M}'-]+)?!?|buenas\s+tardes(?:\s+[\p{L}\p{M}'-]+)?!?|buenas\s+noches(?:\s+[\p{L}\p{M}'-]+)?!?|good\s+morning(?:\s+[\w'-]+)?!?|good\s+afternoon(?:\s+[\w'-]+)?!?|good\s+evening(?:\s+[\w'-]+)?!?|good\s+night(?:\s+[\w'-]+)?!?)[,:\s-]*/iu,
    ''
  )

  const cleaned = withoutGreeting
    .replace(/\bstudent\b/giu, 'estudiante')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
}

export async function suggestExerciseDescription(exerciseName: string): Promise<AISuggestion> {
  const cacheKey = `ai-exercise-${exerciseName}`

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as AISuggestion
  } catch {}

  const prompt = `Eres un entrenador personal experto. El usuario quiere hacer el ejercicio: "${exerciseName}". 
  Proporciona una descripción breve (1-2 oraciones) de cómo hacerlo correctamente y el tiempo estimado en segundos (número solo).
  Responde SOLO en este formato JSON sin explicaciones adicionales:
  {"description": "...", "estimatedDuration": 60, "difficulty": "medio"}`

  const response = await callAI(prompt)

  try {
    const parsed = JSON.parse(response) as AISuggestion
    const suggestion: AISuggestion = {
      description: parsed.description || `${exerciseName}: Realiza correctamente`,
      estimatedDuration: parsed.estimatedDuration || 60,
      difficulty: parsed.difficulty || 'medio',
    }

    AsyncStorage.setItem(cacheKey, JSON.stringify(suggestion)).catch(() => {})
    return suggestion
  } catch {
    return {
      description: `${exerciseName}: Realiza correctamente`,
      estimatedDuration: 60,
      difficulty: 'medio',
    }
  }
}

export async function suggestStudyDuration(subject: string): Promise<number> {
  const prompt = `Sugiere una duración en minutos para un bloque de estudio de "${subject}" para una estudiante. 
  Responde SOLO con un número (entre 30 y 180).`

  const response = await callAI(prompt)
  const duration = parseInt(response.trim())
  return isNaN(duration) ? 90 : Math.max(30, Math.min(180, duration))
}

export async function getDailyMotivation(
  studyBlockCount: number,
  hasRoutine: boolean,
  timeOfDay: string,
  cyclePhaseLabel?: string
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const cycleKey = cyclePhaseLabel ? cyclePhaseLabel.toLowerCase().replace(/\s+/g, '-') : 'sin-fase'
  const cacheKey = `daily-motivation-v2-${today}-${timeOfDay}-${cycleKey}`

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return cached
  } catch {}

  const timeText =
    timeOfDay === 'dawn'
      ? 'la madrugada'
      : timeOfDay === 'morning'
        ? 'la mañana'
        : timeOfDay === 'afternoon'
          ? 'la tarde'
          : 'la noche'

  const cycleHint = cyclePhaseLabel
    ? ` La usuaria está en su ${cyclePhaseLabel}. Ten en cuenta esto con un tono cálido y sin presión.`
    : ''

  const prompt = `Eres Mochi, una asistente adorable. Es ${timeText}. Escribe un mensaje breve y motivador (máximo 2 oraciones) considerando que hoy la usuaria tiene ${studyBlockCount} bloques de estudio${hasRoutine ? ' y una rutina de ejercicio' : ''}.${cycleHint} Reglas estrictas: no saludes, no uses nombre propio, no uses inglés, no uses emojis. Responde solo el mensaje, sin comillas.`

  const response = await callAI(prompt)
  const cleaned = sanitizeDailyMotivationMessage(response)
  const message = cleaned || 'Hoy es un gran día para avanzar un paso más hacia tus metas.'

  try {
    await AsyncStorage.setItem(cacheKey, message)
  } catch {}

  return message
}

// ─── Cocina ───────────────────────────────────────────────────────────────────

export type RecipeGenerationType = 'normal' | 'keto' | 'vegetariana' | 'vegana' | 'alta_proteina'

export interface RecipeGenerationOptions {
  recipeType: RecipeGenerationType
  servings: number
  complexity: RecipeDifficulty
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

  return `Eres Mochi, una asistente de cocina adorable y experta. Una estudiante te pide:

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

/**
 * Genera una receta estructurada a partir del prompt libre de la usuaria.
 * Ejemplo: "quiero hacer unas quesadillas de champiñones para 2 personas"
 */
export async function generateRecipe(
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

/**
 * Sugiere nombres creativos para la receta.
 */
export async function suggestRecipeNames(ingredients: string[]): Promise<string[]> {
  const ingredientList = ingredients.slice(0, 5).join(', ')
  const prompt = `Sugiere 3 nombres creativos y apetitosos en español para una receta que tiene: ${ingredientList}. 
  Responde SOLO con un JSON array de strings, sin explicaciones: ["nombre1", "nombre2", "nombre3"]`

  const response = await callAI(prompt)
  try {
    const clean = response.replace(/```json?\s*/gi, '').replace(/```/gi, '').trim()
    return JSON.parse(clean) as string[]
  } catch {
    return []
  }
}

/**
 * Responde preguntas de la usuaria mientras está cocinando.
 */
export async function askMochiWhileCooking(
  recipeTitle: string,
  currentStepTitle: string,
  question: string
): Promise<string> {
  const prompt = `Eres Mochi, una asistente de cocina adorable. La usuaria está preparando "${recipeTitle}" y está en el paso "${currentStepTitle}". 
  Tiene esta pregunta: "${question}"
  
  Responde de forma breve (máximo 3 oraciones), útil y con tu personalidad cálida. En español.`

  const response = await callAI(prompt)
  return response || 'No pude responder ahora, pero sigue con confianza, ¡tú puedes!'
}

export async function detectStudyDiscipline(subject: string, topic: string): Promise<string> {
  const systemPrompt =
    'Eres una clasificadora académica. Devuelve únicamente la disciplina principal en una frase corta y en minúsculas (ejemplo: matemáticas, programación, historia, idiomas, medicina, derecho, arte). Sin puntuación extra.'

  const userPrompt = `Materia: ${subject}\nTema específico: ${topic}`
  const response = await callStudyModel(systemPrompt, userPrompt, undefined, undefined, 120)
  return response.replace(/[\n\r]/g, ' ').trim().slice(0, 60) || 'estudio general'
}

export async function generateStudySessionPlan(
  subject: string,
  specificTopic: string,
  durationMinutes: number,
  discipline: string,
  attachmentBase64?: string,
  attachmentMimeType?: string
): Promise<string> {
  const systemPrompt = `Eres Mochi, una mentora de estudio cálida para estudiantes. Responde siempre en español, máximo 120 palabras, tono cercano y sin emojis. Debes:
- Detectar o confirmar la disciplina académica a partir de materia y tema.
- Adaptar técnicas específicas según la disciplina (ciencias exactas, humanidades, programación, idiomas, medicina, derecho, artes, etc.).
- Entregar exactamente: 1 frase motivadora, 2 a 3 tips concretos para este tema, y un desglose de tiempo de la sesión.
- Si existe documento o imagen, extrae conceptos clave y úsalos en el plan.`

  const userPrompt = `Materia: ${subject}
Tema específico: ${specificTopic}
Duración total: ${durationMinutes} minutos
Disciplina detectada: ${discipline}

Genera el plan ahora.`

  const response = await callStudyModel(
    systemPrompt,
    userPrompt,
    attachmentBase64,
    attachmentMimeType,
    360
  )

  return response.trim()
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
  const systemPrompt = `Eres Mochi, compañera de estudio en tiempo real. Responde siempre en español, máximo 150 palabras, sin emojis. Contexto fijo:
- Materia: ${subject}
- Tema: ${specificTopic}
- Disciplina: ${discipline}

Interpreta la intención y ayuda según el caso: teoría, resolución paso a paso, depuración de código, traducción/gramática, memorización tipo flashcards y explicación de fórmulas.`

  const hasAttachment = isMultimodalAttachment(attachmentMimeType, attachmentBase64)
  const baseMessages: Array<{ role: ChatRole; content: unknown }> = [
    { role: 'system', content: systemPrompt },
    ...history.map((message) => ({ role: message.role, content: message.content })),
  ]

  if (!hasAttachment) {
    const response = await callOpenRouterMessages(
      [...baseMessages, { role: 'user', content: question }],
      'nvidia/nemotron-3-super-120b-a12b:free',
      450,
      0.4
    )
    return response.trim()
  }

  try {
    const multimodal = getAttachmentBlocks(question, attachmentBase64!, attachmentMimeType!)
    const response = await callOpenRouterMessages(
      [...baseMessages, { role: 'user', content: multimodal }],
      'google/gemini-2.0-flash-exp:free',
      450,
      0.4
    )
    return response.trim()
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: number }).status)
        : undefined

    if (status === 429 || status === 503) {
      const fallback = await callOpenRouterMessages(
        [...baseMessages, { role: 'user', content: question }],
        'nvidia/nemotron-3-super-120b-a12b:free',
        450,
        0.4
      )
      return `No pude procesar el archivo adjunto por saturación temporal. ${fallback}`.trim()
    }

    throw error
  }
}