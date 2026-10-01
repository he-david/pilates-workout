import type { Settings } from '../domain/types'
import { db } from './db'
import { defaultSettings } from './defaultSettings'

export async function getSettings(): Promise<Settings | undefined> {
  return db.settings.get('me')
}

/** Idempotent: writes defaults on first run, otherwise returns the stored settings untouched. */
export async function initSettings(today: Date): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('me')
    if (existing) return existing
    const created = defaultSettings(today)
    await db.settings.put(created)
    return created
  })
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put(settings)
}
