import type { Settings } from '../domain/types'

/** Training days as JS weekdays: Monday, Thursday, Saturday. */
export const DEFAULT_TRAINING_DAYS: readonly number[] = [1, 4, 6]
export const DEFAULT_REMINDER_TIME = '18:30'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Settings used until the user saves their own (start date = today, local day). */
export function defaultSettings(today: Date): Settings {
  return {
    id: 'me',
    startDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    trainingDays: [...DEFAULT_TRAINING_DAYS],
    reminderTime: DEFAULT_REMINDER_TIME,
  }
}
