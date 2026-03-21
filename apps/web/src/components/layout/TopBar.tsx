import { LogOut, Star } from 'lucide-react'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { useSession } from '@/hooks/useSession'
import { useProfile } from '@/hooks/useProfile'

export function TopBar() {
  const { signOut } = useSession()
  const { profile } = useProfile()

  return (
    <header className="flex items-center justify-between rounded-3xl border border-purple-200 bg-white/80 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm text-purple-700">Tu espacio en desktop</p>
        <p className="text-lg font-bold text-purple-950">
          {profile?.full_name?.trim() || 'Estudiante'}
        </p>
      </div>

      <div className="hidden xl:block">
        <MochiCompanion mood="happy" size={42} title="Mochi" message="Contigo hoy" />
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
          <Star className="h-4 w-4" />
          {profile?.total_points ?? 0} pts
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-600"
          onClick={() => {
            void signOut()
          }}
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  )
}
