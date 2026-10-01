import { describe, expect, it } from 'vitest'
import {
  shortDate,
  dateHeader,
  dayNameLong,
  dayNameShort,
  doseLabel,
  doseShort,
  durationLabel,
  totalTimeLabel,
  minutesLabel,
  minutesShort,
  monthName,
} from '../../src/domain/format'
import type { Dose } from '../../src/domain/types'

describe('doseLabel', () => {
  const cases: [Dose, string][] = [
    [{ kind: 'reps', reps: 8 }, '8 ismétlés'],
    [{ kind: 'reps', reps: 6, perSide: true }, '6 ismétlés oldalanként'],
    [{ kind: 'reps', reps: 6, perSide: false }, '6 ismétlés'],
    [{ kind: 'time', seconds: 45 }, '45 mp'],
    [{ kind: 'time', seconds: 30, sets: 1 }, '30 mp'],
    [{ kind: 'time', seconds: 30, sets: 2 }, '2 × 30 mp'],
  ]
  it.each(cases)('%j -> %s', (dose, expected) => {
    expect(doseLabel(dose)).toBe(expected)
  })
})

describe('doseLabel units and minutes', () => {
  it('renders count and direction units', () => {
    expect(doseLabel({ kind: 'reps', reps: 100 }, 'count')).toBe('100 számolás')
    expect(doseLabel({ kind: 'reps', reps: 5, perSide: true }, 'direction')).toBe('5 irányonként')
  })
  it('renders whole minutes as perc, others unchanged', () => {
    expect(doseLabel({ kind: 'time', seconds: 480 })).toBe('8 perc')
    expect(doseLabel({ kind: 'time', seconds: 120 })).toBe('2 perc')
    expect(doseLabel({ kind: 'time', seconds: 90 })).toBe('90 mp')
    expect(doseLabel({ kind: 'time', seconds: 60, sets: 2 })).toBe('2 × 60 mp')
  })
})

describe('doseShort', () => {
  it.each([
    [{ kind: 'reps', reps: 8 }, undefined, '8 ism.'],
    [{ kind: 'reps', reps: 8, perSide: true }, undefined, '8 / oldal'],
    [{ kind: 'reps', reps: 5, perSide: true }, 'direction', '5 / irány'],
    [{ kind: 'reps', reps: 100 }, 'count', '100 számolás'],
    [{ kind: 'time', seconds: 120 }, undefined, '2 perc'],
    [{ kind: 'time', seconds: 480 }, undefined, '8 perc'],
    [{ kind: 'time', seconds: 45 }, undefined, '45 mp'],
    [{ kind: 'time', seconds: 35, sets: 3 }, undefined, '3 × 35 mp'],
  ] as const)('%j %s -> %s', (dose, unit, expected) => {
    expect(doseShort(dose, unit)).toBe(expected)
  })
})

describe('minutes', () => {
  it.each([
    [3000, '50 perc', "50'"],
    [480, '8 perc', "8'"],
    [89, '1 perc', "1'"],
    [0, '0 perc', "0'"],
  ])('%i s', (s, long, short) => {
    expect(minutesLabel(s)).toBe(long)
    expect(minutesShort(s)).toBe(short)
  })
})

describe('durationLabel', () => {
  it.each([
    [0, '0:00'],
    [45, '0:45'],
    [3080, '51:20'],
    [3599, '59:59'],
    [3600, '1 ó 0 p'],
    [24720, '6 ó 52 p'],
    [-5, '0:00'],
  ])('%i s -> %s', (s, expected) => {
    expect(durationLabel(s)).toBe(expected)
  })
})

describe('names', () => {
  it('day names', () => {
    expect(dayNameLong(0)).toBe('Vasárnap')
    expect(dayNameLong(4)).toBe('Csütörtök')
    expect(dayNameLong(9)).toBe('')
    expect([1, 2, 3, 4, 5, 6, 0].map(dayNameShort)).toEqual([
      'H',
      'K',
      'Sze',
      'Cs',
      'P',
      'Szo',
      'V',
    ])
    expect(dayNameShort(-1)).toBe('')
  })
  it('month names', () => {
    expect(monthName(0)).toBe('január')
    expect(monthName(9)).toBe('október')
    expect(monthName(11)).toBe('december')
    expect(monthName(12)).toBe('')
  })
  it('dateHeader', () => {
    expect(dateHeader(new Date(2026, 9, 1))).toBe('Csütörtök, október 1.')
    expect(dateHeader(new Date(2026, 0, 31))).toBe('Szombat, január 31.')
  })
})

describe('shortDate', () => {
  it('formats month and day', () => {
    expect(shortDate(new Date(2026, 9, 1))).toBe('október 1.')
  })
})

describe('totalTimeLabel', () => {
  it.each([
    [0, '0 p'],
    [59, '0 p'],
    [3080, '51 p'],
    [3600, '1 ó 0 p'],
    [24720, '6 ó 52 p'],
    [-5, '0 p'],
  ])('%i s -> %s', (s, expected) => {
    expect(totalTimeLabel(s)).toBe(expected)
  })
})
