import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AdminStats = {
  total_users: number
  active_last_7_days: number
  total_study_sessions: number
  total_points_awarded: number
}

type ActiveUserRow = { day: string; active_users: number }

type AdminUser = {
  id: string
  full_name: string | null
  total_points: number
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeDaily, setActiveDaily] = useState<ActiveUserRow[]>([])
  const [topUsers, setTopUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [statsRes, dailyRes, usersRes] = await Promise.all([
        supabase.rpc('get_admin_stats'),
        supabase.rpc('get_admin_active_users_daily', { days_back: 30 }),
        supabase.rpc('get_admin_users', { page_limit: 10, page_offset: 0 }),
      ])

      if (statsRes.error || dailyRes.error || usersRes.error) {
        setError(statsRes.error?.message ?? dailyRes.error?.message ?? usersRes.error?.message ?? 'Error cargando admin')
        return
      }

      setStats((statsRes.data as AdminStats) ?? null)
      setActiveDaily((dailyRes.data as ActiveUserRow[] | null) ?? [])
      setTopUsers((usersRes.data as AdminUser[] | null) ?? [])
    }

    void load()
  }, [])

  if (error) return <p className="text-sm font-semibold text-red-600">{error}</p>
  if (!stats) return <p className="text-sm font-semibold text-slate-700">Cargando métricas...</p>

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-950">Dashboard admin</h1>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Total usuarias</p><p className="text-3xl font-black text-slate-900">{stats.total_users}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Activas 7 días</p><p className="text-3xl font-black text-slate-900">{stats.active_last_7_days}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Sesiones estudio</p><p className="text-3xl font-black text-slate-900">{stats.total_study_sessions}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Puntos otorgados</p><p className="text-3xl font-black text-slate-900">{stats.total_points_awarded}</p></div>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-bold text-slate-900">Usuarias activas por día (30 días)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {activeDaily.slice(-12).map((row) => (
            <div key={row.day} className="rounded-xl bg-slate-100 p-2">
              <p className="text-xs font-semibold text-slate-500">{row.day}</p>
              <p className="text-lg font-black text-slate-900">{row.active_users}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-bold text-slate-900">Top 10 usuarias por puntos</h2>
        <div className="mt-3 space-y-2">
          {topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">{index + 1}. {user.full_name ?? 'Sin nombre'}</p>
              <p className="text-sm font-black text-slate-900">{user.total_points} pts</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
