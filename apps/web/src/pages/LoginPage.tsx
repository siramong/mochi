import { Navigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { AuthComponent } from '@/components/Auth'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { useSession } from '@/hooks/useSession'

const APK_RELEASE_URL = 'https://github.com/siramong/mochi/releases/latest'

export function LoginPage() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-purple-800">Cargando...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#fce7f3,_#ede9fe_50%,_#dbeafe_100%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-purple-200 bg-white p-8 shadow-sm">
        <MochiCompanion
          mood="excited"
          title="Mochi te acompaña"
          message="Tu escritorio bonito para estudiar con calma y constancia."
          className="mb-5"
        />
        <h1 className="text-center text-2xl font-black text-purple-950">Bienvenida a Mochi</h1>
        <p className="mt-2 text-center text-sm text-purple-700">Inicia sesión para abrir tu dashboard</p>
        <a
          href={APK_RELEASE_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
        >
          <Download className="h-4 w-4" />
          Instalar app en Android
        </a>
        <div className="mt-6">
          <AuthComponent />
        </div>
      </div>
    </div>
  )
}
