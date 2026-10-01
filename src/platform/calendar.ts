/**
 * Weekly training reminder as an iCalendar (RFC 5545) file. Pure: no browser APIs, time is passed in.
 * (Lives in platform/ because it is the Calendar hand-off; the share call itself is in platform/share.ts.)
 */

export const ICS_FILENAME = 'tonus-emlekezteto.ics'
export const ICS_MIME = 'text/calendar'
export const TZID = 'Europe/Budapest'

const DEFAULT_TIME = '18:30'
const DURATION = 'PT50M'
/** Alert minutes before the event starts. */
const ALARM_MINUTES = 10
/** The program has 36 sessions: the event repeats exactly that many times. */
export const REMINDER_OCCURRENCES = 36

/** JS weekday (0 = Sunday) to iCalendar BYDAY code. */
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

export type IcsInput = {
  /** Settings.startDate, "YYYY-MM-DD". */
  startDate: string
  /** JS weekdays, 0 = Sunday. */
  trainingDays: readonly number[]
  /** "HH:MM"; anything else falls back to 18:30. */
  reminderTime?: string
  /** Current moment: DTSTAMP, and the earliest possible first occurrence (local day). */
  now: Date
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** Escapes TEXT values: backslash, semicolon, comma, newline. */
export function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

const encoder = new TextEncoder()

/** Folds a content line at 75 octets (CRLF excluded), never splitting a UTF-8 character. */
export function foldLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let size = 0
  let limit = 75
  for (const ch of line) {
    const bytes = encoder.encode(ch).length
    if (size + bytes > limit) {
      out.push(current)
      current = ' '
      size = 1
      limit = 75
    }
    current += ch
    size += bytes
  }
  out.push(current)
  return out
}

function parseTime(time: string | undefined): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '')
  const h = match ? Number(match[1]) : NaN
  const m = match ? Number(match[2]) : NaN
  if (h > 23 || m > 59 || Number.isNaN(h)) return parseTime(DEFAULT_TIME)
  return { h, m }
}

function localDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

function startDay(startDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate)
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}

/** First training day on or after max(startDate, today), as "YYYYMMDD". Null without training days. */
export function firstOccurrence(
  startDate: string,
  trainingDays: readonly number[],
  now: Date,
): string | null {
  if (trainingDays.length === 0) return null
  const from = Math.max(startDay(startDate) ?? 0, localDay(now))
  for (let i = 0; i < 7; i++) {
    const d = new Date(from + i * 86_400_000)
    if (trainingDays.includes(d.getUTCDay())) {
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
    }
  }
  return null
}

/** "BYDAY" value, Monday-first and deduplicated: [6, 1, 4] -> "MO,TH,SA". */
export function byDay(trainingDays: readonly number[]): string {
  const days = [...new Set(trainingDays)].filter((d) => d >= 0 && d <= 6)
  return days
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => BYDAY[d])
    .join(',')
}

function utcStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

const TIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:STANDARD',
  'DTSTART:19701025T030000',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'BEGIN:DAYLIGHT',
  'DTSTART:19700329T020000',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'END:VTIMEZONE',
]

/** Builds the .ics text (CRLF line endings), or null when there are no training days. */
export function buildReminderIcs(input: IcsInput): string | null {
  const first = firstOccurrence(input.startDate, input.trainingDays, input.now)
  const days = byDay(input.trainingDays)
  if (!first || !days) return null
  const { h, m } = parseTime(input.reminderTime)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tonus//Pilates//HU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...TIMEZONE,
    'BEGIN:VEVENT',
    'UID:tonus-reminder@tonus',
    `DTSTAMP:${utcStamp(input.now)}`,
    `DTSTART;TZID=${TZID}:${first}T${pad(h)}${pad(m)}00`,
    `DURATION:${DURATION}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days};COUNT=${REMINDER_OCCURRENCES}`,
    `SUMMARY:${escapeText('Tónus – Pilates edzés')}`,
    `DESCRIPTION:${escapeText('Ideje edzeni! Nyisd meg a Tónus appot, és kezdd el a mai edzést.')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText('Tónus – Pilates edzés')}`,
    `TRIGGER:-PT${ALARM_MINUTES}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.flatMap(foldLine).join('\r\n') + '\r\n'
}
