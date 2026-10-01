import type { Dose, RepUnit } from './types'

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

function wholeMinutes(dose: Extract<Dose, { kind: 'time' }>): number | undefined {
  const single = !dose.sets || dose.sets <= 1
  return single && dose.seconds >= 60 && dose.seconds % 60 === 0 ? dose.seconds / 60 : undefined
}

function timeLabel(dose: Extract<Dose, { kind: 'time' }>): string {
  const minutes = wholeMinutes(dose)
  if (minutes !== undefined) return `${minutes} perc`
  return dose.sets && dose.sets > 1 ? `${dose.sets} × ${dose.seconds} mp` : `${dose.seconds} mp`
}

/**
 * "8 ismétlés", "8 ismétlés oldalanként", "100 számolás", "45 mp", "2 × 30 mp", "8 perc".
 * `unit` is the exercise's repUnit and overrides the per-side wording.
 */
export function doseLabel(dose: Dose, unit?: RepUnit): string {
  if (dose.kind === 'time') return timeLabel(dose)
  if (unit === 'count') return `${dose.reps} számolás`
  if (unit === 'direction') return `${dose.reps} irányonként`
  const base = `${dose.reps} ismétlés`
  return dose.perSide ? `${base} oldalanként` : base
}

/** Compact list form: "8 ism.", "8 / oldal", "5 / irány", "100 számolás", "3 × 35 mp", "2 perc". */
export function doseShort(dose: Dose, unit?: RepUnit): string {
  if (dose.kind === 'time') return timeLabel(dose)
  if (unit === 'count') return `${dose.reps} számolás`
  if (unit === 'direction') return `${dose.reps} / irány`
  return dose.perSide ? `${dose.reps} / oldal` : `${dose.reps} ism.`
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
