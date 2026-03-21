import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fce7f3,_#ede9fe_45%,_#dbeafe_100%)]">
      <div className="mx-auto flex max-w-[1500px]">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          <TopBar />
          <section className="mt-4 rounded-3xl border border-white/70 bg-white/70 p-4 lg:p-6">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  )
}
