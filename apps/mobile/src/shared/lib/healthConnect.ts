import {
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
} from 'react-native-health-connect'
import type { Permission } from 'react-native-health-connect'

// ─── Permisos de ciclo ────────────────────────────────────────────────────────

export const CYCLE_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'MenstruationFlow' },
  { accessType: 'read', recordType: 'MenstruationPeriod' },
]

// ─── Solicitar permisos ───────────────────────────────────────────────────────

export async function requestCyclePermissions(): Promise<boolean> {
  try {
    const available = await initialize()
    if (!available) return false

    await requestPermission(CYCLE_PERMISSIONS)

    return await hasCyclePermissions()
  } catch (error) {
    console.error('Error al solicitar permisos de ciclo:', error)
    return false
  }
}

// ─── Verificar permisos ───────────────────────────────────────────────────────

export async function hasCyclePermissions(): Promise<boolean> {
  try {
    const available = await initialize()
    if (!available) return false

    const granted = await getGrantedPermissions()
    return CYCLE_PERMISSIONS.every((required) =>
      granted.some(
        (g) =>
          g.accessType === required.accessType &&
          g.recordType === required.recordType,
      ),
    )
  } catch (error) {
    console.error('Error al verificar permisos de ciclo:', error)
    return false
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MenstruationRecord = {
  startDate: string
  endDate: string
}

// ─── Leer registros de menstruación ──────────────────────────────────────────

export async function readMenstruationRecords(): Promise<MenstruationRecord[]> {
  try {
    const available = await initialize()
    if (!available) return []

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const now = new Date()

    const { records } = await readRecords('MenstruationPeriod', {
      timeRangeFilter: {
        operator: 'between',
        startTime: sixMonthsAgo.toISOString(),
        endTime: now.toISOString(),
      },
    })

    return records
      .map((record) => ({
        startDate: record.startTime,
        endDate: record.endTime,
      }))
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      )
  } catch (error) {
    console.error('Error al leer registros de menstruación:', error)
    return []
  }
}
