import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import type { AIRecipeResponse } from '@/src/shared/types/database'

export interface AISuggestion {
  description: string
  estimatedDuration?: number // en segundos
  difficulty?: 'fácil' | 'medio' | 'difícil'
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || ''

const genAI = new GoogleGenerativeAI(API_KEY)

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'mochi.app',
    'X-Title': 'Mochi',
  },
  dangerouslyAllowBrowser: true,
})

async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) return ''

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    console.log('🟢 Gemini OK:', text.slice(0, 80))
    return text
  } catch (error) {
    console.error('🔴 Gemini error:', error)
    return ''
  }
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_KEY) return ''

  try {
    const completion = await openrouter.chat.completions.create({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
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
  if (API_KEY) {
    const result = await callGemini(prompt)
    if (result) return result
  }

  if (OPENROUTER_KEY) {
    const result = await callOpenRouter(prompt)
    if (result) return result
  }

  return ''
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
  userName: string,
  studyBlockCount: number,
  hasRoutine: boolean,
  timeOfDay: string
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const cacheKey = `daily-motivation-${today}-${timeOfDay}`

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

  const prompt = `Eres Mochi, una asistente adorable. Es ${timeText}. Saluda a ${userName} de forma breve y motivadora (máximo 2 oraciones) considerando que hoy tiene ${studyBlockCount} bloques de estudio${hasRoutine ? ' y una rutina de ejercicio' : ''}. Responde solo el mensaje, sin comillas.`

  const response = await callAI(prompt)
  const message = response || `¡Hola ${userName}! Hoy es un gran día para alcanzar tus metas.`

  try {
    await AsyncStorage.setItem(cacheKey, message)
  } catch {}

  return message
}

// ─── Cocina ───────────────────────────────────────────────────────────────────

/**
 * Genera una receta estructurada a partir del prompt libre de la usuaria.
 * Ejemplo: "quiero hacer unas quesadillas de champiñones para 2 personas"
 */
export async function generateRecipe(userPrompt: string): Promise<AIRecipeResponse> {
  const prompt = `Eres Mochi, una asistente de cocina adorable y experta. Una estudiante te pide:

"${userPrompt}"

Genera una receta detallada, realista y deliciosa en español. Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown, sin bloques de código) con esta estructura exacta:

{
  "title": "Nombre de la receta",
  "description": "Descripción apetitosa de 1-2 oraciones",
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "servings": 2,
  "difficulty": "fácil",
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
- difficulty debe ser exactamente: "fácil", "media" o "difícil"
- duration_seconds en los pasos: usa null si es un paso manual sin tiempo fijo
- Los pasos deben ser suficientemente detallados para que alguien sin experiencia los siga
- Máximo 12 ingredientes y 10 pasos
- Los tips deben ser consejos prácticos y útiles
- Si la usuaria no especificó porciones, usa 2 por defecto`

  const response = await callAI(prompt)

  try {
    const clean = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()

    const parsed = JSON.parse(clean) as AIRecipeResponse

    if (!parsed.title || !parsed.steps || !parsed.ingredients) {
      throw new Error('Respuesta de IA incompleta')
    }

    const validDifficulties: AIRecipeResponse['difficulty'][] = ['fácil', 'media', 'difícil']
    if (!validDifficulties.includes(parsed.difficulty)) {
      parsed.difficulty = 'media'
    }

    return parsed
  } catch (error) {
    console.error('Error parseando receta de IA:', error, '\nRespuesta raw:', response)
    throw new Error('No pude entender la respuesta de la IA. Intenta de nuevo.')
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