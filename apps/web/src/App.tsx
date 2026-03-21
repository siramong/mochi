import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { SessionProvider, useSessionContext } from '@/contexts/SessionContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { AuthCallback } from '@/pages/AuthCallback'
import { CookingPage } from '@/pages/CookingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExercisePage } from '@/pages/ExercisePage'
import { GoalsPage } from '@/pages/GoalsPage'
import { GratitudePage } from '@/pages/GratitudePage'
import { HabitsPage } from '@/pages/HabitsPage'
import { LoginPage } from '@/pages/LoginPage'
import { MoodPage } from '@/pages/MoodPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { VouchersPage } from '@/pages/VouchersPage'
import { StudyExamsPage } from '@/pages/study/StudyExamsPage'
import { StudyFormPage } from '@/pages/study/StudyFormPage'
import { StudyHistoryPage } from '@/pages/study/StudyHistoryPage'
import { StudyPage } from '@/pages/study/StudyPage'

function ProtectedLayout() {
  const { session, loading } = useSessionContext()

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

  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  )
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSessionContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-sm font-semibold text-purple-800">Cargando...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/new" element={<StudyFormPage />} />
          <Route path="/study/:blockId/edit" element={<StudyFormPage />} />
          <Route path="/study/history" element={<StudyHistoryPage />} />
          <Route path="/study/exams" element={<StudyExamsPage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/cooking" element={<CookingPage />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/gratitude" element={<GratitudePage />} />
          <Route path="/vouchers" element={<VouchersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  )
}
