import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
  }
})

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      }
    },
  }
})

import {
  convertNoteToAction,
  createAIClient,
  generateRecoveryPlanSuggestions,
  predictWellnessRisk,
} from './index'

function makeCompletion(content: string) {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  }
}

describe('@mochi/ai shared feature functions', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    createAIClient('test-key')
  })

  it('convertNoteToAction devuelve acción estructurada en español', async () => {
    mockCreate.mockResolvedValueOnce(
      makeCompletion(
        JSON.stringify({
          type: 'study',
          confidence: 0.91,
          data: {
            title: 'Repasar cálculo diferencial',
            description: 'Crear un bloque para practicar integrales.',
            durationMinutes: 45,
            difficulty: 'medium',
          },
          reasoning: 'Detecté examen y conceptos académicos, por eso lo clasifiqué como estudio.',
        })
      )
    )

    const result = await convertNoteToAction({
      note: 'Mañana tengo examen de cálculo',
      context: { cyclePhase: 'lútea', energyLevel: 3, currentGoals: ['Aprobar cálculo'] },
    })

    expect(result.type).toBe('study')
    expect(result.confidence).toBeGreaterThan(0.8)
    expect(result.data.title).toContain('cálculo')
    expect(result.reasoning).toContain('estudio')
  })

  it('convertNoteToAction aplica retry exponencial en rate limit', async () => {
    const rateLimitError = Object.assign(new Error('rate limit'), { status: 429 })
    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(
        makeCompletion(
          JSON.stringify({
            type: 'exercise',
            confidence: 0.72,
            data: {
              title: 'Cardio suave',
              durationMinutes: 30,
              difficulty: 'easy',
            },
            reasoning: 'Detecté actividad física explícita en la nota.',
          })
        )
      )

    const result = await convertNoteToAction({ note: 'Necesito hacer 30min de cardio' })

    expect(result.type).toBe('exercise')
    expect(mockCreate).toHaveBeenCalledTimes(3)
  })

  it('predictWellnessRisk retorna neutral en parse error', async () => {
    mockCreate.mockResolvedValueOnce(makeCompletion('respuesta inválida sin json'))

    const result = await predictWellnessRisk({
      userId: 'u1',
      recentEnergyLevels: [2, 2, 3, 2, 3, 2, 2],
      cyclePhase: 'menstrual',
      recentMoodRatings: [2, 3, 2, 2, 3, 2, 2],
      currentStreak: 0,
      recentExamSprints: [{ exam: 'Cálculo', daysLeft: 2 }],
      totalGoalsActive: 5,
      totalRoutinesActive: 4,
    })

    expect(result.riskPercentage).toBe(50)
    expect(result.confidence).toBeLessThanOrEqual(0.5)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('predictWellnessRisk usa cache cuando hay rate limit', async () => {
    mockCreate
      .mockResolvedValueOnce(
        makeCompletion(
          JSON.stringify({
            riskPercentage: 64,
            factors: {
              lowEnergy: true,
              cyclePhase: 'lútea',
              examStress: 78,
              streakRisk: true,
              academicOverload: true,
            },
            recommendations: [
              { type: 'rest', text: 'Haz una pausa breve y vuelve con un solo objetivo.', urgency: 'high' },
            ],
            confidence: 0.82,
          })
        )
      )
      .mockRejectedValueOnce(Object.assign(new Error('429'), { status: 429 }))

    const input = {
      userId: 'u-cache',
      recentEnergyLevels: [2, 3, 2, 3, 2, 2, 3],
      cyclePhase: 'lútea',
      recentMoodRatings: [3, 3, 2, 2, 3, 2, 3],
      currentStreak: 1,
      recentExamSprints: [{ exam: 'Física', daysLeft: 3 }],
      totalGoalsActive: 3,
      totalRoutinesActive: 3,
    }

    const first = await predictWellnessRisk(input)
    const second = await predictWellnessRisk(input)

    expect(first.riskPercentage).toBe(64)
    expect(second.riskPercentage).toBe(64)
  })

  it('generateRecoveryPlanSuggestions devuelve 3 tareas progresivas', async () => {
    mockCreate.mockResolvedValueOnce(
      makeCompletion(
        JSON.stringify([
          {
            day: 1,
            description: 'Haz 15 minutos de repaso de tus apuntes favoritos.',
            difficulty: 'easy',
            estimatedMinutes: 15,
          },
          {
            day: 2,
            description: 'Completa un bloque enfocado de ejercicios guiados.',
            difficulty: 'medium',
            estimatedMinutes: 30,
          },
          {
            day: 3,
            description: 'Realiza un simulacro corto y registra tus aprendizajes.',
            difficulty: 'hard',
            estimatedMinutes: 45,
          },
        ])
      )
    )

    const result = await generateRecoveryPlanSuggestions({
      userId: 'u2',
      context: {
        currentEnergy: 3,
        cyclePhase: 'folicular',
        favoriteExercises: ['yoga'],
        favoriteStudySubjects: ['biología'],
      },
    })

    expect(result).toHaveLength(3)
    expect(result[0].difficulty).toBe('easy')
    expect(result[1].difficulty).toBe('medium')
    expect(result[2].difficulty).toBe('hard')
  })
})
