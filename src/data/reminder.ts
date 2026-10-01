import { buildReminderIcs, ICS_FILENAME, ICS_MIME } from '../platform/calendar'
import { shareFile } from '../platform/share'
import { db } from './db'
import { defaultSettings } from './defaultSettings'

/**
 * Hands the weekly reminder .ics to the share sheet / download. Returns whether the file left the app
 * (false when the share was cancelled or there are no training days). Screens call this, not platform/.
 */
export async function shareReminder(now: Date): Promise<boolean> {
  const settings = (await db.settings.get('me')) ?? defaultSettings(now)
  const ics = buildReminderIcs({ ...settings, now })
  if (!ics) return false
  const file = new File([ics], ICS_FILENAME, { type: `${ICS_MIME};charset=utf-8` })
  return (await shareFile(file)) !== 'cancelled'
}
