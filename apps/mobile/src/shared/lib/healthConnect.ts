import {
  getGrantedPermissions,
  initialize,
  readRecords,
  requestPermission,
} from 'react-native-health-connect'
import type { Permission } from 'react-native-health-connect'

// ─── Permisos de ciclo ───────────────────────────────────────────────────────

export const CYCLE_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'MenstruationFlow' },
  { accessType: 'read', recordType: 'MenstruationPeriod' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function allGranted(granted: Permission[]): boolean {
  return CYCLE_PERMISSIONS.every((p) =>
    granted.some((g) => g.accessType === p.accessType && g.recordType === p.recordType)
  )
}

// ─── Solicitar permisos ──────────────────────────────────────────────────────

export async function requestCyclePermissions(): Promise<boolean> {
  const initialized = await initialize()
  if (!initialized) return false

  const granted = await requestPermission(CYCLE_PERMISSIONS)
  return allGranted(granted)
}

// ─── Verificar permisos ──────────────────────────────────────────────────────

export async function hasCyclePermissions(): Promise<boolean> {
  const initialized = await initialize()
  if (!initialized) return false

  const granted = await getGrantedPermissions()
  return allGranted(granted)
}

// ─── Leer registros de menstruación ─────────────────────────────────────────

export async function readMenstruationRecords(): Promise<Array<{ startDate: string; endDate: string }>> {
  const initialized = await initialize()
  if (!initialized) return []

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  try {
    const { records } = await readRecords('MenstruationPeriod', {
      timeRangeFilter: {
        operator: 'between',
        startTime: sixMonthsAgo.toISOString(),
        endTime: new Date().toISOString(),
      },
    })

    return records
      .map((r) => ({ startDate: r.startTime, endDate: r.endTime }))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  } catch {
    return []
  }
}
