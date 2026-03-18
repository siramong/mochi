import AuthComponent from '@/components/Auth'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

function App() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-8">
          <AuthComponent />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Hola, {session.user.email}</p>
        <button
          className="mt-4 text-sm text-muted-foreground underline"
          onClick={() => supabase.auth.signOut()}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default App