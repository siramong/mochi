import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/hooks/useSession'
import type { Recipe } from '@/types/database'
import { EmptyState } from '@/components/common/EmptyState'

export function CookingPage() {
  const { session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

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
