import type { ComponentType } from 'react'
import { BarChart2, BookOpen, ChefHat, Dumbbell, Gift, Heart, House, Layers, Notebook, Settings, Sparkles, Target, Trophy, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUserSettings } from '@/hooks/useUserSettings'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  module?: keyof ReturnType<typeof useUserSettings>['enabledModules']
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Inicio', icon: House },
  { to: '/study', label: 'Estudio', icon: BookOpen, module: 'study' },
  { to: '/exercise', label: 'Ejercicio', icon: Dumbbell, module: 'exercise' },
  { to: '/habits', label: 'Hábitos', icon: Sparkles, module: 'habits' },
  { to: '/goals', label: 'Metas', icon: Target, module: 'goals' },
  { to: '/cooking', label: 'Cocina', icon: ChefHat, module: 'cooking' },
  { to: '/mood', label: 'Ánimo', icon: Heart, module: 'mood' },
  { to: '/gratitude', label: 'Gratitud', icon: Notebook, module: 'gratitude' },
  { to: '/vouchers', label: 'Vales', icon: Gift, module: 'vouchers' },
  { to: '/notes', label: 'Notas', icon: Notebook, module: 'notes' },
  { to: '/flashcards', label: 'Flashcards', icon: Layers, module: 'study' },
  { to: '/profile', label: 'Perfil', icon: UserRound },
  { to: '/analytics', label: 'Analíticas', icon: BarChart2 },
  { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function Sidebar() {
  const { enabledModules } = useUserSettings()

  return (
    <aside className="hidden w-72 shrink-0 border-r border-purple-200/80 bg-white/80 p-5 lg:block">
      <div className="rounded-3xl border border-purple-200 bg-gradient-to-br from-pink-100 via-yellow-50 to-blue-100 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-purple-700">Mochi Web</p>
        <div className="mt-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-purple-600" />
          <p className="text-sm font-semibold text-purple-900">Dashboard de productividad</p>
        </div>
      </div>

      <nav className="mt-5 space-y-2">
        {navItems
          .filter((item) => (item.module ? enabledModules[item.module] : true))
          .map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-purple-900 hover:bg-purple-100',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
      </nav>
    </aside>
  )
}
