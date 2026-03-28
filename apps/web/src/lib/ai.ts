import {
  askMochiWhileCooking,
  askStudyCompanion,
  createAIClient,
  detectStudyDiscipline,
  generateRecipe,
  generateStudySessionPlan,
  type RecipeGenerationOptions,
  type RecipeGenerationType,
} from '@mochi/ai'

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

if (OPENROUTER_KEY) {
  createAIClient(OPENROUTER_KEY)
}

export {
  askMochiWhileCooking,
  askStudyCompanion,
  detectStudyDiscipline,
  generateRecipe,
  generateStudySessionPlan,
}

export type { RecipeGenerationOptions, RecipeGenerationType }
