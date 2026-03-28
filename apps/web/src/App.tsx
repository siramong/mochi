import { Navigate, Route, Routes } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider, useSessionContext } from '@/contexts/SessionContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { AuthCallback } from '@/pages/AuthCallback'
import { CookingPage } from '@/pages/CookingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ExercisePage } from '@/pages/ExercisePage'
import { FlashcardsPage } from '@/pages/FlashcardsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { GratitudePage } from '@/pages/GratitudePage'
import { HabitsPage } from '@/pages/HabitsPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MoodPage } from '@/pages/MoodPage'
import { NotesPage } from '@/pages/NotesPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RecipeDetailPage } from '@/pages/RecipeDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TermsPage } from '@/pages/TermsPage'
import { VouchersPage } from '@/pages/VouchersPage'
import { StudyExamsPage } from '@/pages/study/StudyExamsPage'
import { StudyFormPage } from '@/pages/study/StudyFormPage'
import { StudyHistoryPage } from '@/pages/study/StudyHistoryPage'
import { StudyPage } from '@/pages/study/StudyPage'
import { StudyTimerPage } from '@/pages/study/StudyTimerPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminVouchersPage } from '@/pages/admin/AdminVouchersPage'

function ProtectedLayout() {
  const { requiresOnboarding, session, loading } = useSessionContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-sm font-semibold text-purple-800">Cargando tu espacio...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (requiresOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  )
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { requiresOnboarding, session, loading } = useSessionContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-sm font-semibold text-purple-800">Cargando...</p>
      </div>
    )
  }

  if (session) {
    if (requiresOnboarding) {
      return <Navigate to="/onboarding" replace />
    }

    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AdminGuard() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-700">Verificando acceso admin...</p>
      </div>
    )
  }

  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return <AdminLayout />
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        {/* ── Landing pública ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Rutas de auth ── */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ── Rutas legales — accesibles sin sesión ── */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* ── Login — solo sin sesión ── */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* ── Rutas protegidas ── */}
        <Route element={<ProtectedLayout />}>
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/new" element={<StudyFormPage />} />
          <Route path="/study/:blockId/edit" element={<StudyFormPage />} />
          <Route path="/study/timer" element={<StudyTimerPage />} />
          <Route path="/study/history" element={<StudyHistoryPage />} />
          <Route path="/study/exams" element={<StudyExamsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/cooking" element={<CookingPage />} />
          <Route path="/cooking/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/gratitude" element={<GratitudePage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/vouchers" element={<VouchersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  )
}