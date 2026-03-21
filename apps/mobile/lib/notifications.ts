import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import type { StudyBlock } from '@/types/database'

// ─── AsyncStorage keys ───────────────────────────────────────────────────────

const STORAGE_KEY = {
  ENABLED: 'notifications:enabled',
  MORNING_ENABLED: 'notifications:morning_enabled',
  STUDY_ENABLED: 'notifications:study_enabled',
  HABIT_ENABLED: 'notifications:habit_enabled',
  HABIT_TIME: 'notifications:habit_time',
  COOKING_ENABLED: 'notifications:cooking_enabled',
  COOKING_TIME: 'notifications:cooking_time',
} as const

// ─── Notification identifiers ────────────────────────────────────────────────

const NOTIFICATION_ID = {
  MORNING: 'morning-reminder',
  HABIT: 'habit-reminder',
  COOKING: 'cooking-reminder',
  studyBlock: (blockId: string) => `study-block-${blockId}`,
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationPrefs = {
  enabled: boolean
  morningEnabled: boolean
  studyEnabled: boolean
  habitEnabled: boolean
  habitTime: string
  cookingEnabled: boolean
  cookingTime: string
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  })
  return status
}

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync()
  return status
}

// ─── Preferences (AsyncStorage) ──────────────────────────────────────────────

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  const [enabled, morningEnabled, studyEnabled, habitEnabled, habitTime, cookingEnabled, cookingTime] =
    await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY.ENABLED),
      AsyncStorage.getItem(STORAGE_KEY.MORNING_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY.STUDY_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY.HABIT_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY.HABIT_TIME),
      AsyncStorage.getItem(STORAGE_KEY.COOKING_ENABLED),
      AsyncStorage.getItem(STORAGE_KEY.COOKING_TIME),
    ])
  return {
    enabled: enabled === 'true',
    morningEnabled: morningEnabled !== 'false',
    studyEnabled: studyEnabled !== 'false',
    habitEnabled: habitEnabled !== 'false',
    habitTime: habitTime ?? '21:00',
    // cooking off by default — la usuaria lo activa explícitamente
    cookingEnabled: cookingEnabled === 'true',
    cookingTime: cookingTime ?? '19:00',
  }
}

export async function saveNotificationPrefs(prefs: Partial<NotificationPrefs>): Promise<void> {
  const entries: [string, string][] = []

  if (prefs.enabled !== undefined)
    entries.push([STORAGE_KEY.ENABLED, prefs.enabled ? 'true' : 'false'])
  if (prefs.morningEnabled !== undefined)
    entries.push([STORAGE_KEY.MORNING_ENABLED, prefs.morningEnabled ? 'true' : 'false'])
  if (prefs.studyEnabled !== undefined)
    entries.push([STORAGE_KEY.STUDY_ENABLED, prefs.studyEnabled ? 'true' : 'false'])
  if (prefs.habitEnabled !== undefined)
    entries.push([STORAGE_KEY.HABIT_ENABLED, prefs.habitEnabled ? 'true' : 'false'])
  if (prefs.habitTime !== undefined)
    entries.push([STORAGE_KEY.HABIT_TIME, prefs.habitTime])
  if (prefs.cookingEnabled !== undefined)
    entries.push([STORAGE_KEY.COOKING_ENABLED, prefs.cookingEnabled ? 'true' : 'false'])
  if (prefs.cookingTime !== undefined)
    entries.push([STORAGE_KEY.COOKING_TIME, prefs.cookingTime])

  await AsyncStorage.multiSet(entries)
}

// ─── Parse helpers ───────────────────────────────────────────────────────────

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = hhmm.split(':')
  return {
    hour: parseInt(hourStr ?? '0', 10),
    minute: parseInt(minuteStr ?? '0', 10),
  }
}

function toExpoWeekday(appDayOfWeek: number): number {
  return appDayOfWeek + 1
}

function subtractMinutes(hhmm: string, mins: number): { hour: number; minute: number } {
  const { hour, minute } = parseTime(hhmm)
  const totalMinutes = hour * 60 + minute - mins
  if (totalMinutes < 0) {
    const wrapped = (totalMinutes % 1440 + 1440) % 1440
    return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 }
  }
  return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 }
}

// ─── Morning reminder ────────────────────────────────────────────────────────

export async function scheduleMorningReminder(wakeUpTime: string): Promise<void> {
  await cancelMorningReminder()
  const { hour, minute } = parseTime(wakeUpTime)

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID.MORNING,
    content: {
      title: '¡Buenos días!',
      body: 'Hoy es un gran día para estudiar y crecer. Tú puedes.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function cancelMorningReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID.MORNING).catch(() => {})
}

// ─── Study block reminders ───────────────────────────────────────────────────

export async function scheduleStudyBlockReminders(blocks: StudyBlock[]): Promise<void> {
  await cancelAllStudyBlockReminders()

  for (const block of blocks) {
    const { hour, minute } = subtractMinutes(block.start_time, 10)

    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID.studyBlock(block.id),
      content: {
        title: 'Bloque de estudio próximo',
        body: `Tu sesión de ${block.subject} empieza en 10 minutos`,
        sound: true,
        data: { screen: 'study' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(block.day_of_week),
        hour,
        minute,
      },
    })
  }
}

export async function cancelAllStudyBlockReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const studyIds = scheduled
    .map((n) => n.identifier)
    .filter((id) => id.startsWith('study-block-'))
  await Promise.all(
    studyIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  )
}

// ─── Habit reminder ──────────────────────────────────────────────────────────

export async function scheduleHabitReminder(time: string): Promise<void> {
  await cancelHabitReminder()
  const { hour, minute } = parseTime(time)

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID.HABIT,
    content: {
      title: '¿Ya completaste tus hábitos?',
      body: 'No olvides registrar tus hábitos de hoy',
      sound: true,
      data: { screen: 'habits' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function cancelHabitReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID.HABIT).catch(() => {})
}

// ─── Cooking reminder ─────────────────────────────────────────────────────────

/**
 * Recordatorio diario para inspirar a la usuaria a cocinar.
 * Por defecto a las 19:00 — justo antes de preparar la cena.
 */
export async function scheduleCookingReminder(time: string): Promise<void> {
  await cancelCookingReminder()
  const { hour, minute } = parseTime(time)

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID.COOKING,
    content: {
      title: '¿Qué vas a cocinar hoy? 🍳',
      body: 'Mochi tiene ideas deliciosas esperándote',
      sound: true,
      data: { screen: 'cooking' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function cancelCookingReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID.COOKING).catch(() => {})
}

// ─── Master cancel ───────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// ─── Full sync ───────────────────────────────────────────────────────────────

export async function syncNotifications(
  prefs: NotificationPrefs,
  wakeUpTime: string,
  studyBlocks: StudyBlock[]
): Promise<void> {
  if (!prefs.enabled) {
    await cancelAllNotifications()
    return
  }

  if (prefs.morningEnabled) {
    await scheduleMorningReminder(wakeUpTime)
  } else {
    await cancelMorningReminder()
  }

  if (prefs.studyEnabled) {
    await scheduleStudyBlockReminders(studyBlocks)
  } else {
    await cancelAllStudyBlockReminders()
  }

  if (prefs.habitEnabled) {
    await scheduleHabitReminder(prefs.habitTime)
  } else {
    await cancelHabitReminder()
  }

  if (prefs.cookingEnabled) {
    await scheduleCookingReminder(prefs.cookingTime)
  } else {
    await cancelCookingReminder()
  }
}