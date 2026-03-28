import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AdminUser = {
  id: string
  full_name: string | null
  total_points: number
  created_at: string | null
}

export function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data, error: rpcError } = await supabase.rpc('get_admin_users', {
        page_limit: 20,
        page_offset: page * 20,
      })

      if (rpcError) {
        setError(rpcError.message)
        return
      }

      setRows((data as AdminUser[] | null) ?? [])
    }

    void load()
  }, [page])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => (row.full_name ?? '').toLowerCase().includes(q))
  }, [rows, query])

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-950">Usuarios</h1>

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre"
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Puntos</th>
              <th className="px-3 py-2">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setSelected(user)}>
                <td className="px-3 py-2 font-semibold text-slate-900">{user.full_name ?? 'Sin nombre'}</td>
                <td className="px-3 py-2">{user.total_points}</td>
                <td className="px-3 py-2">{user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold" onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</button>
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold" onClick={() => setPage((p) => p + 1)}>Siguiente</button>
      </div>

      {selected ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-900">Detalle de usuaria</h2>
          <p className="mt-2 text-sm text-slate-700">Nombre: {selected.full_name ?? 'Sin nombre'}</p>
          <p className="text-sm text-slate-700">Puntos: {selected.total_points}</p>
          <p className="text-sm text-slate-700">ID: {selected.id}</p>
        </div>
      ) : null}
    </div>
  )
}
