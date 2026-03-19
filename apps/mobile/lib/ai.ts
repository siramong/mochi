import AsyncStorage from '@react-native-async-storage/async-storage'

export interface AISuggestion {
  description: string
  estimatedDuration?: number // en segundos
  difficulty?: 'fácil' | 'medio' | 'difícil'
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || ''
const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || ''

async function callGemini(prompt: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
        }),
      }
    )

    if (!response.ok) throw new Error('Gemini API error')
    const data = await response.json()
    return data.candidates[0]?.content?.parts[0]?.text || ''
  } catch (error) {
    console.error('Gemini error:', error)
    return ''
  }
}

async function callOpenRouter(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'mochi.app',
        'X-Title': 'Mochi',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) throw new Error('OpenRouter error')
    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('OpenRouter error:', error)
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
    if (cached) return JSON.parse(cached)
  } catch {}

  const prompt = `Eres un entrenador personal experto. El usuario quiere hacer el ejercicio: "${exerciseName}". 
  Proporciona una descripción breve (1-2 oraciones) de cómo hacerlo correctamente y el tiempo estimado en segundos (número solo).
  Responde SOLO en este formato JSON sin explicaciones adicionales:
  {"description": "...", "estimatedDuration": 60, "difficulty": "medio"}`

  const response = await callAI(prompt)
  
  try {
    const parsed = JSON.parse(response)
    const suggestion: AISuggestion = {
      description: parsed.description || `${exerciseName}: Realiza correctamente`,
      estimatedDuration: parsed.estimatedDuration || 60,
      difficulty: parsed.difficulty || 'medio',
    }

    // Cache por 7 días
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
  hasRoutine: boolean
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  const cacheKey = `daily-motivation-${today}`

  try {
    const cached = await AsyncStorage.getItem(cacheKey)
    if (cached) return cached
  } catch {}

  const prompt = `Eres Mochi, una asistente de estudio adorable y motivadora. Saluda a ${userName} de forma breve y motivadora (máximo 2 oraciones) considerando que hoy tiene ${studyBlockCount} bloques de estudio${hasRoutine ? ' y una rutina de ejercicio' : ''}. Responde solo el mensaje, sin comillas ni explicaciones.`

  const response = await callAI(prompt)
  const message = response || `¡Hola ${userName}! Hoy es un gran día para alcanzar tus metas.`

  try {
    await AsyncStorage.setItem(cacheKey, message)
  } catch {}

  return message
}
