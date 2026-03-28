import { LogOut, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMochiLevel } from '@mochi/supabase/levels'
import { MochiCompanion } from '@/components/common/MochiCompanion'
import { usePoints } from '@/hooks/usePoints'
import { useSession } from '@/hooks/useSession'
import { useProfile } from '@/hooks/useProfile'

export function TopBar() {
  const { session, signOut } = useSession()
  const { profile } = useProfile()
  const { points } = usePoints(session?.user.id)
  const level = getMochiLevel(points)

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
        <div className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
          Nivel {level.level} · {level.name}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-800">
          <Star className="h-4 w-4" />
          {points} pts
        </div>
        {profile?.is_admin ? (
          <Link to="/admin" className="text-xs font-bold text-purple-600 hover:text-purple-800">
            Admin
          </Link>
        ) : null}
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
