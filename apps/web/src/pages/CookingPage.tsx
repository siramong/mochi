import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import { searchUnsplashImage } from '@/lib/unsplash'
import type { Recipe } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function CookingPage() {
  const { session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [recipeImages, setRecipeImages] = useState<Record<string, string>>({})
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadRecipes() {
      const { data } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<Recipe[]>()

      setRecipes(data ?? [])
      setLoading(false)
    }

    void loadRecipes()
  }, [session?.user.id])

  const loadRecipeImage = useCallback(async (recipe: Recipe) => {
    if (recipeImages[recipe.id] || imageLoading[recipe.id]) return

    setImageLoading((prev) => ({ ...prev, [recipe.id]: true }))
    const imageUrl = await searchUnsplashImage(`${recipe.title} food dish`, 'landscape')

    if (imageUrl) {
      setRecipeImages((prev) => ({ ...prev, [recipe.id]: imageUrl }))
    }

    setImageLoading((prev) => ({ ...prev, [recipe.id]: false }))
  }, [imageLoading, recipeImages])

  useEffect(() => {
    recipes.forEach((recipe) => {
      void loadRecipeImage(recipe)
    })
  }, [loadRecipeImage, recipes])

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando recetas...</p>
  }

  if (recipes.length === 0) {
    return <EmptyState title="Sin recetas guardadas" description="Tus recetas creadas en móvil aparecerán aquí." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Recetas</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="mb-3 h-28 overflow-hidden rounded-xl bg-orange-100">
              {recipeImages[recipe.id] ? (
                <img src={recipeImages[recipe.id]} alt={recipe.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-semibold text-orange-700">
                  {imageLoading[recipe.id] ? 'Cargando imagen...' : 'Sin imagen'}
                </div>
              )}
            </div>
            <p className="font-bold text-orange-950">{recipe.title}</p>
            {recipe.description ? <p className="mt-1 text-sm text-orange-800">{recipe.description}</p> : null}
            <p className="mt-2 text-xs font-semibold text-orange-700">
              {recipe.total_time_minutes} min • {recipe.servings} porciones • {recipe.difficulty}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
