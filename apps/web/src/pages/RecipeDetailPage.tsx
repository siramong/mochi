import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Heart, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { searchUnsplashImage } from '@/lib/unsplash'
import { useSession } from '@/hooks/useSession'
import type { Recipe, RecipeIngredient, RecipeStep } from '@/types/database'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60
  return restSeconds > 0 ? `${minutes} min ${restSeconds}s` : `${minutes} min`
}

function scaleAmount(amount: number | null, baseServings: number, targetServings: number): string {
  if (amount === null) return ''
  if (!baseServings) return String(amount)

  const scaled = (amount / baseServings) * targetServings
  const rounded = Math.round(scaled * 10) / 10
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

export function RecipeDetailPage() {
  const navigate = useNavigate()
  const { recipeId } = useParams<{ recipeId: string }>()
  const { session } = useSession()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [steps, setSteps] = useState<RecipeStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [heroLoading, setHeroLoading] = useState(false)
  const [servings, setServings] = useState(2)
  const [notesInput, setNotesInput] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingFavorite, setSavingFavorite] = useState(false)

  const userId = session?.user.id

  const loadRecipe = useCallback(async () => {
    if (!userId || !recipeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [recipeRes, ingredientRes, stepsRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', recipeId).eq('user_id', userId).single<Recipe>(),
      supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('order_index', { ascending: true })
        .returns<RecipeIngredient[]>(),
      supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('step_number', { ascending: true })
        .returns<RecipeStep[]>(),
    ])

    if (recipeRes.error || ingredientRes.error || stepsRes.error) {
      setError(recipeRes.error?.message || ingredientRes.error?.message || stepsRes.error?.message || 'Error cargando receta')
      setLoading(false)
      return
    }

    const loadedRecipe = recipeRes.data
    setRecipe(loadedRecipe)
    setIngredients(ingredientRes.data ?? [])
    setSteps(stepsRes.data ?? [])
    setServings(loadedRecipe.servings)
    setNotesInput(loadedRecipe.personal_notes ?? '')

    setHeroLoading(true)
    const image = await searchUnsplashImage(`${loadedRecipe.title} food dish`, 'landscape')
    setHeroImage(image)
    setHeroLoading(false)
    setLoading(false)
  }, [recipeId, userId])

  useEffect(() => {
    void loadRecipe()
  }, [loadRecipe])

  const totalTime = useMemo(() => {
    if (!recipe) return 0
    return recipe.total_time_minutes > 0
      ? recipe.total_time_minutes
      : recipe.prep_time_minutes + recipe.cook_time_minutes
  }, [recipe])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleToggleFavorite = async () => {
    if (!recipe || !userId || savingFavorite) return

    const next = !recipe.is_favorite
    setSavingFavorite(true)
    setRecipe((previous) => (previous ? { ...previous, is_favorite: next } : previous))

    const { error: updateError } = await supabase
      .from('recipes')
      .update({ is_favorite: next })
      .eq('id', recipe.id)
      .eq('user_id', userId)

    if (updateError) {
      setRecipe((previous) => (previous ? { ...previous, is_favorite: !next } : previous))
      setError(updateError.message)
    }

    setSavingFavorite(false)
  }

  const handleSaveNotes = async () => {
    if (!recipe || !userId) return

    setSavingNotes(true)
    const value = notesInput.trim() || null

    const { error: updateError } = await supabase
      .from('recipes')
      .update({ personal_notes: value })
      .eq('id', recipe.id)
      .eq('user_id', userId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setRecipe((previous) => (previous ? { ...previous, personal_notes: value } : previous))
    }

    setSavingNotes(false)
  }

  const handleDelete = async () => {
    if (!recipe || !userId) return

    const confirmed = window.confirm(`¿Eliminar "${recipe.title}"? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipe.id)
      .eq('user_id', userId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    navigate('/cooking')
  }

  if (loading) {
    return <p className="text-sm font-semibold text-orange-700">Cargando receta...</p>
  }

  if (error && !recipe) {
    return <p className="text-sm font-semibold text-red-600">{error}</p>
  }

  if (!recipe) {
    return <p className="text-sm font-semibold text-red-600">No se encontró la receta.</p>
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/cooking" className="text-sm font-semibold text-orange-700 hover:text-orange-900">
          ← Volver a cocina
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleToggleFavorite()
            }}
            disabled={savingFavorite}
            className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-800"
          >
            <Heart className={['mr-1 inline h-4 w-4', recipe.is_favorite ? 'fill-orange-500 text-orange-500' : ''].join(' ')} />
            Favorito
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDelete()
            }}
            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600"
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-orange-200 bg-orange-50">
        <div className="h-56 bg-orange-100">
          {heroImage ? (
            <img src={heroImage} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-orange-700">
              {heroLoading ? 'Buscando imagen...' : 'Sin imagen de portada'}
            </div>
          )}
        </div>
        <div className="p-5">
          <h1 className="text-3xl font-black text-orange-950">{recipe.title}</h1>
          {recipe.description ? <p className="mt-2 text-sm text-orange-800">{recipe.description}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">Total: {totalTime} min</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Prep: {recipe.prep_time_minutes} min</span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Cocción: {recipe.cook_time_minutes} min</span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">{recipe.difficulty}</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{recipe.servings} porciones base</span>
            {recipe.cuisine_type ? (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{recipe.cuisine_type}</span>
            ) : null}
          </div>

          {recipe.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-5 rounded-3xl border border-orange-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black text-orange-950">Ingredientes</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-800"
              onClick={() => setServings((previous) => Math.max(1, previous - 1))}
            >
              -
            </button>
            <p className="text-sm font-semibold text-orange-800">
              {servings} {servings === 1 ? 'porción' : 'porciones'}
            </p>
            <button
              type="button"
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-800"
              onClick={() => setServings((previous) => previous + 1)}
            >
              +
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {ingredients.map((ingredient) => {
            const amount = scaleAmount(ingredient.amount, recipe.servings, servings)
            return (
              <li key={ingredient.id} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-slate-800">
                <span className="font-bold">
                  {amount ? `${amount}${ingredient.unit ? ` ${ingredient.unit}` : ''} ` : ''}
                  {ingredient.name}
                </span>
                {ingredient.notes ? <span className="ml-1 text-orange-700">({ingredient.notes})</span> : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-5 rounded-3xl border border-orange-200 bg-white p-5">
        <h2 className="text-xl font-black text-orange-950">Pasos</h2>
        <div className="mt-4 space-y-3">
          {steps.map((step) => (
            <article key={step.id} className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-orange-900">
                  {step.step_number}. {step.title}
                </p>
                {step.duration_seconds ? (
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-orange-700">
                    {formatDuration(step.duration_seconds)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-800">{step.instructions}</p>
              {step.tip ? <p className="mt-2 text-xs font-semibold text-orange-700">Tip de Mochi: {step.tip}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-orange-200 bg-white p-5">
        <h2 className="text-xl font-black text-orange-950">Notas personales</h2>
        <textarea
          value={notesInput}
          onChange={(event) => setNotesInput(event.target.value)}
          className="mt-3 min-h-28 w-full rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm"
          placeholder="Escribe aquí ajustes, sustituciones o ideas para la próxima vez"
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleSaveNotes()
            }}
            disabled={savingNotes}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingNotes ? (
              <>
                <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              'Guardar notas'
            )}
          </button>
          {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
        </div>
      </section>
    </div>
  )
}
