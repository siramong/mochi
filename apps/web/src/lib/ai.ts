import {
  AIError,
  askMochiWhileCooking,
  askStudyCompanion,
  callAI,
  callAIText,
  callAIWithFallback,
  callAIWithMessages,
  createAIClient,
  detectStudyDiscipline,
  generateFlashcards,
  generateRecipe,
  generateStudyBlockSuggestions,
  generateStudySessionPlan,
  getAIClient,
  parseAIJson,
  type MochiAIContract,
  type RecipeGenerationOptions,
  type RecipeGenerationType,
} from '@mochi/ai'

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

if (OPENROUTER_KEY) {
  createAIClient(OPENROUTER_KEY)
}

export {
  AIError,
  askMochiWhileCooking,
  askStudyCompanion,
  callAI,
  callAIText,
  callAIWithFallback,
  callAIWithMessages,
  detectStudyDiscipline,
  generateFlashcards,
  generateRecipe,
  generateStudyBlockSuggestions,
  generateStudySessionPlan,
  getAIClient,
  parseAIJson,
}

export type { MochiAIContract, RecipeGenerationOptions, RecipeGenerationType }
