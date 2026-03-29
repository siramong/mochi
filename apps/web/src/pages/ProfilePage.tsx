import { useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import type { Achievement } from '@/types/database'

const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function ProfilePage() {
  const { profile, streak, achievements, loading, error } = useProfile()
  const [catalog, setCatalog] = useState<Achievement[]>([])

  useEffect(() => {
    async function loadCatalog() {
      const { data } = await supabase.from('achievements').select('*').returns<Achievement[]>()
      setCatalog(data ?? [])
    }

    void loadCatalog()
  }, [])

  const unlockedIds = useMemo(() => new Set(achievements.map((item) => item.achievement_id)), [achievements])

  const orderedAchievements = useMemo(() => {
    const unlocked: Achievement[] = []
    const locked: Achievement[] = []

    for (const achievement of catalog) {
      if (unlockedIds.has(achievement.id)) {
        unlocked.push(achievement)
      } else {
        locked.push(achievement)
      }
    }

    locked.sort((a, b) => a.category.localeCompare(b.category))
    return [...unlocked, ...locked]
  }, [catalog, unlockedIds])

  const last7Days = useMemo(() => getLast7Days(), [])

  const streakDays = useMemo(() => {
    const activeDays = new Set<string>()
    if (!streak?.last_activity_date || streak.current_streak <= 0) return activeDays

    const lastDate = new Date(streak.last_activity_date)
    const streakLength = Math.min(streak.current_streak, 365)

    for (let i = 0; i < streakLength; i++) {
      const d = new Date(lastDate)
      d.setDate(lastDate.getDate() - i)
      activeDays.add(d.toISOString().slice(0, 10))
    }

    return activeDays
  }, [streak])

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
          <p className="text-xs font-bold uppercase text-pink-800">Logros desbloqueados</p>
          <p className="mt-1 text-3xl font-black text-pink-950">{achievements.length}</p>
        </div>
      </div>

      <section className="mt-5 rounded-3xl border border-blue-200 bg-white p-4">
        <h2 className="text-base font-bold text-blue-900">Racha de los últimos 7 días</h2>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            {last7Days.map((day) => (
              <span
                key={day}
                className={[
                  'h-4 w-4 rounded-full border',
                  streakDays.has(day) ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white',
                ].join(' ')}
                title={streakDays.has(day) ? `${day}: actividad registrada` : `${day}: sin actividad`}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500">
            {dayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Información personal</h2>
        <p className="mt-2 text-sm text-purple-800">Nombre: {profile.full_name?.trim() || 'Sin configurar'}</p>
        <p className="text-sm text-purple-800">Hora de despertar: {profile.wake_up_time || 'Sin configurar'}</p>
      </section>

      <section className="mt-5 rounded-3xl border border-purple-200 bg-white p-4">
        <h2 className="text-base font-bold text-purple-900">Logros</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedAchievements.map((achievement) => {
            const unlocked = unlockedIds.has(achievement.id)
            const isSecretLocked = achievement.is_secret && !unlocked
            return (
              <article
                key={achievement.id}
                className={[
                  'rounded-2xl border p-3 transition',
                  unlocked ? 'border-purple-200 bg-purple-50' : 'border-slate-200 bg-slate-50 opacity-40',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{isSecretLocked ? '???' : achievement.title}</p>
                  {!unlocked ? <Lock className="h-4 w-4 text-slate-500" /> : null}
                </div>
                <p className="mt-1 text-xs text-slate-600">{achievement.category}</p>
                <p className="mt-2 text-xs text-slate-700">{isSecretLocked ? 'Desbloquea este logro para descubrirlo.' : achievement.description}</p>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
