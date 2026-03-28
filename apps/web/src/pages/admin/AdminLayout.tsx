import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/vouchers', label: 'Vales' },
  { to: '/admin/users', label: 'Usuarios' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="w-64 border-r border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Panel de administración</p>
          <nav className="mt-4 space-y-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'block rounded-xl px-3 py-2 text-sm font-semibold',
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-bold text-slate-800">Panel de administración</p>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
