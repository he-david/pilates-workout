import type { Dose } from './types'

const DAYS_LONG = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'] as const
const DAYS_SHORT = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'] as const
const MONTHS = [
  'január',
  'február',
  'március',
  'április',
  'május',
  'június',
  'július',
  'augusztus',
  'szeptember',
  'október',
  'november',
  'december',
] as const

/** "8 ismétlés", "8 ismétlés oldalanként", "45 mp", "2 × 30 mp" */
export function doseLabel(dose: Dose): string {
  if (dose.kind === 'reps') {
    const base = `${dose.reps} ismétlés`
    return dose.perSide ? `${base} oldalanként` : base
  }
  return dose.sets && dose.sets > 1 ? `${dose.sets} × ${dose.seconds} mp` : `${dose.seconds} mp`
}

/** Whole minutes, rounded: "50 perc" */
export function minutesLabel(seconds: number): string {
  return `${Math.round(seconds / 60)} perc`
}

/** Compact minutes: "8'" */
export function minutesShort(seconds: number): string {
  return `${Math.round(seconds / 60)}'`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Under an hour "51:20" (m:ss); an hour or more "6 ó 52 p". */
export function durationLabel(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total >= 3600) {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    return `${h} ó ${m} p`
  }
  return `${Math.floor(total / 60)}:${pad2(total % 60)}`
}

/** Day index 0 = Sunday .. 6 = Saturday (Date.getDay). */
export function dayNameLong(dayIndex: number): string {
  return DAYS_LONG[dayIndex] ?? ''
}

export function dayNameShort(dayIndex: number): string {
  return DAYS_SHORT[dayIndex] ?? ''
}

/** Month index 0 = January. Lowercase. */
export function monthName(monthIndex: number): string {
  return MONTHS[monthIndex] ?? ''
}

/** "Csütörtök, október 1." */
export function dateHeader(date: Date): string {
  return `${dayNameLong(date.getDay())}, ${monthName(date.getMonth())} ${date.getDate()}.`
}
