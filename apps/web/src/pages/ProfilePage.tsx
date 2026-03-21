import { useProfile } from '@/hooks/useProfile'
import { EmptyState } from '@/components/common/EmptyState'

export function ProfilePage() {
  const { profile, streak, achievements, loading, error } = useProfile()

  if (loading) {
    return <p className="text-sm text-purple-700">Cargando perfil...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!profile) {
    return <EmptyState title="No se encontró tu perfil" description="Intenta cerrar sesión y volver a entrar." />
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-purple-950">Perfil</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-xs font-bold uppercase text-yellow-800">Puntos</p>
          <p className="mt-1 text-3xl font-black text-yellow-950">{profile.total_points}</p>
        </div>
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-800">Racha actual</p>
          <p className="mt-1 text-3xl font-black text-blue-950">{streak?.current_streak ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-pink-200 bg-pink-50 p-4">
          <p className="text-xs font-bold uppercase text-pink-800">Logros</p>
          <p className="mt-1 text-3xl font-black text-pink-950">{achievements.length}</p>
        </div>
      </div>

      <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Información personal</h2>
        <p className="mt-2 text-sm text-purple-800">Nombre: {profile.full_name?.trim() || 'Sin configurar'}</p>
        <p className="text-sm text-purple-800">Hora de despertar: {profile.wake_up_time || 'Sin configurar'}</p>
      </section>
    </div>
  )
}
