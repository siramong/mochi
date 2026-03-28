import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Loader2, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { generateRecipe, type RecipeGenerationType } from '@/lib/ai'
import { addPoints } from '@/lib/gamification'
import { supabase } from '@/lib/supabase'
import { searchUnsplashImage } from '@/lib/unsplash'
import { useSession } from '@/hooks/useSession'
import type { Recipe, RecipeDifficulty } from '@/types/database'

const recipeTypeOptions: Array<{ value: RecipeGenerationType; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'keto', label: 'Keto' },
  { value: 'vegetariana', label: 'Vegetariana' },
  { value: 'vegana', label: 'Vegana' },
  { value: 'alta_proteina', label: 'Alta proteína' },
]

const complexityOptions: Array<{ value: RecipeDifficulty; label: string }> = [
  { value: 'fácil', label: 'Fácil' },
  { value: 'media', label: 'Media' },
  { value: 'difícil', label: 'Difícil' },
]

const difficultyClasses: Record<RecipeDifficulty, string> = {
  'fácil': 'bg-emerald-100 text-emerald-800',
  'media': 'bg-yellow-100 text-yellow-800',
  'difícil': 'bg-red-100 text-red-800',
}

export function CookingPage() {
  const navigate = useNavigate()
  const { session } = useSession()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recipeImages, setRecipeImages] = useState<Record<string, string>>({})
  const [imageLoadingMap, setImageLoadingMap] = useState<Record<string, boolean>>({})

  const [showModal, setShowModal] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [recipeType, setRecipeType] = useState<RecipeGenerationType>('normal')
  const [servings, setServings] = useState(2)
  const [complexity, setComplexity] = useState<RecipeDifficulty>('media')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState<'thinking' | 'saving'>('thinking')
  const [formError, setFormError] = useState<string | null>(null)

  const userId = session?.user.id

  const canGenerate = useMemo(() => prompt.trim().length > 0 && !isGenerating, [prompt, isGenerating])

  const loadRecipes = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<Recipe[]>()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setRecipes(data ?? [])
    setLoading(false)
  }, [userId])

  const loadRecipeImage = useCallback(
    async (recipe: Recipe) => {
      if (recipeImages[recipe.id] || imageLoadingMap[recipe.id]) return

      setImageLoadingMap((previous) => ({ ...previous, [recipe.id]: true }))
      const imageUrl = await searchUnsplashImage(`${recipe.title} food dish`, 'landscape')
      if (imageUrl) {
        setRecipeImages((previous) => ({ ...previous, [recipe.id]: imageUrl }))
      }
      setImageLoadingMap((previous) => ({ ...previous, [recipe.id]: false }))
    },
    [imageLoadingMap, recipeImages]
  )

  useEffect(() => {
    void loadRecipes()
  }, [loadRecipes])

  useEffect(() => {
    recipes.forEach((recipe) => {
      void loadRecipeImage(recipe)
    })
  }, [loadRecipeImage, recipes])

  const handleGenerate = async () => {
    if (!userId || !prompt.trim()) return

    setIsGenerating(true)
    setFormError(null)
    setGeneratingStep('thinking')

    try {
      const aiRecipe = await generateRecipe(prompt.trim(), {
        recipeType,
        servings,
        complexity,
      })

      setGeneratingStep('saving')

      const totalTime = aiRecipe.prep_time_minutes + aiRecipe.cook_time_minutes

      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          title: aiRecipe.title,
          description: aiRecipe.description,
          total_time_minutes: totalTime,
          prep_time_minutes: aiRecipe.prep_time_minutes,
          cook_time_minutes: aiRecipe.cook_time_minutes,
          servings: aiRecipe.servings,
          difficulty: aiRecipe.difficulty,
          cuisine_type: aiRecipe.cuisine_type || null,
          tags: aiRecipe.tags ?? [],
          user_prompt: `${prompt.trim()} | Tipo: ${recipeType} | Personas: ${servings} | Complejidad: ${complexity}`,
        })
        .select('id')
        .single<{ id: string }>()

      if (recipeError) {
        throw recipeError
      }

      if (aiRecipe.ingredients.length > 0) {
        const { error: ingError } = await supabase.from('recipe_ingredients').insert(
          aiRecipe.ingredients.map((ingredient, index) => ({
            recipe_id: recipeData.id,
            order_index: index,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            notes: ingredient.notes,
          }))
        )

        if (ingError) throw ingError
      }

      if (aiRecipe.steps.length > 0) {
        const { error: stepError } = await supabase.from('recipe_steps').insert(
          aiRecipe.steps.map((step) => ({
            recipe_id: recipeData.id,
            step_number: step.step_number,
            title: step.title,
            instructions: step.instructions,
            duration_seconds: step.duration_seconds,
            temperature: step.temperature,
            tip: step.tip,
          }))
        )

        if (stepError) throw stepError
      }

      await addPoints(userId, 5)

      setShowModal(false)
      setPrompt('')
      setRecipeType('normal')
      setServings(2)
      setComplexity('media')

      await loadRecipes()
      navigate(`/cooking/${recipeData.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo generar la receta')
    } finally {
      setIsGenerating(false)
      setGeneratingStep('thinking')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-orange-950">Cocina</h1>
          <p className="mt-1 text-sm text-orange-700">
            {recipes.length} {recipes.length === 1 ? 'receta' : 'recetas'} guardadas
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setShowModal(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generar receta con IA
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm font-semibold text-orange-700">Cargando recetas...</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}

      {!loading && !error && recipes.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="Aún no tienes recetas" description="Genera tu primera receta con IA y guárdala aquí." />
        </div>
      ) : null}

      {!loading && !error && recipes.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className="overflow-hidden rounded-3xl border border-orange-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5"
              onClick={() => navigate(`/cooking/${recipe.id}`)}
            >
              <div className="h-36 overflow-hidden bg-orange-100">
                {recipeImages[recipe.id] ? (
                  <img src={recipeImages[recipe.id]} alt={recipe.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-orange-700">
                    {imageLoadingMap[recipe.id] ? 'Cargando imagen...' : 'Sin imagen'}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-base font-bold text-orange-950">{recipe.title}</p>
                {recipe.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-orange-800">{recipe.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                    {recipe.total_time_minutes} min
                  </span>
                  <span className={[
                    'rounded-full px-2 py-1 text-xs font-bold',
                    difficultyClasses[recipe.difficulty],
                  ].join(' ')}>
                    {recipe.difficulty}
                  </span>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                    {recipe.servings} porciones
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 md:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            {isGenerating ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                <p className="mt-4 text-sm font-semibold text-orange-900">
                  {generatingStep === 'thinking' ? 'Pensando en tu receta...' : 'Guardando receta...'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                  <h2 className="text-lg font-black text-orange-950">Generar receta</h2>
                </div>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-orange-900">¿Qué quieres cocinar?</span>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="mt-2 min-h-24 w-full rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm"
                    placeholder="Ej: pasta con atún rápida para 2 personas"
                  />
                </label>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-orange-900">Tipo</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipeTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-bold',
                          recipeType === option.value
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-orange-200 bg-white text-orange-700',
                        ].join(' ')}
                        onClick={() => setRecipeType(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2">
                  <p className="text-sm font-semibold text-orange-900">Porciones</p>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      className="rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-bold text-orange-700"
                      onClick={() => setServings((previous) => Math.max(1, previous - 1))}
                    >
                      -
                    </button>
                    <p className="text-base font-black text-orange-950">
                      {servings} {servings === 1 ? 'persona' : 'personas'}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-bold text-orange-700"
                      onClick={() => setServings((previous) => Math.min(12, previous + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-orange-900">Complejidad</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {complexityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-bold',
                          complexity === option.value
                            ? 'border-orange-500 bg-orange-500 text-white'
                            : 'border-orange-200 bg-white text-orange-700',
                        ].join(' ')}
                        onClick={() => setComplexity(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formError ? <p className="mt-3 text-sm font-semibold text-red-600">{formError}</p> : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!canGenerate}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    onClick={() => {
                      void handleGenerate()
                    }}
                  >
                    Generar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
