import {
  buildReminderIcs,
  byDay,
  escapeText,
  firstOccurrence,
  foldLine,
} from '../../src/platform/calendar'

const now = new Date(2026, 9, 1, 9, 0, 0) // Thu 2026-10-01 local

describe('escapeText', () => {
  it.each([
    ['a,b', 'a\\,b'],
    ['a;b', 'a\\;b'],
    ['a\\b', 'a\\\\b'],
    ['a\nb', 'a\\nb'],
    ['a\r\nb', 'a\\nb'],
    ['Tónus – ő ű', 'Tónus – ő ű'],
  ])('%j', (input, out) => expect(escapeText(input)).toBe(out))
})

describe('foldLine', () => {
  const bytes = (s: string) => new TextEncoder().encode(s).length
  it('leaves short lines alone', () => expect(foldLine('ABC')).toEqual(['ABC']))
  it('folds ASCII at 75 octets with a leading space on continuations', () => {
    const parts = foldLine('X'.repeat(160))
    expect(parts.map(bytes)).toEqual([75, 75, 12])
    expect(parts[1]!.startsWith(' ')).toBe(true)
    expect(parts.join('\r\n ').replace(/\r\n {2}/g, '')).toBeDefined()
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe('X'.repeat(160))
  })
  it('never splits a multi-byte character', () => {
    const line = 'ő'.repeat(60) // 120 octets
    const parts = foldLine(line)
    for (const p of parts) expect(bytes(p)).toBeLessThanOrEqual(75)
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(line)
  })
  it('exactly 75 octets is not folded', () => expect(foldLine('Y'.repeat(75))).toHaveLength(1))
})

describe('byDay', () => {
  it.each([
    [[1, 4, 6], 'MO,TH,SA'],
    [[6, 0, 1], 'MO,SA,SU'],
    [[4, 4, 1], 'MO,TH'],
    [[], ''],
  ])('%j', (days, out) => expect(byDay(days)).toBe(out))
})

describe('firstOccurrence', () => {
  it.each([
    ['2026-10-01', [1, 4, 6], '20261001'], // today is a training day (Thu)
    ['2026-10-01', [1, 6], '20261003'], // next Sat
    ['2026-10-01', [3], '20261007'], // next Wed
    ['2026-10-12', [1, 4, 6], '20261012'], // future start (Mon)
    ['2026-10-13', [1, 4, 6], '20261015'], // future start, Tue -> Thu
    ['2026-09-01', [1], '20261005'], // past start -> from today
    ['garbage', [1], '20261005'],
  ])('start %s days %j', (start, days, out) => expect(firstOccurrence(start, days, now)).toBe(out))
  it('is null without training days', () =>
    expect(firstOccurrence('2026-10-01', [], now)).toBeNull())
})

describe('buildReminderIcs', () => {
  const ics = buildReminderIcs({
    startDate: '2026-10-01',
    trainingDays: [1, 4, 6],
    reminderTime: '18:30',
    now,
  })!
  const lines = ics.split('\r\n')

  it('uses CRLF everywhere and ends with a CRLF', () => {
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })
  it('has calendar headers and a Budapest timezone', () => {
    expect(lines.slice(0, 5)).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tonus//Pilates//HU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ])
    expect(ics).toContain('TZID:Europe/Budapest')
    expect(ics).toContain('TZNAME:CET')
    expect(ics).toContain('TZNAME:CEST')
    expect(ics).toContain('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU')
    expect(ics).toContain('RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU')
  })
  it('has one event with the expected fields', () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    expect(lines).toContain('UID:tonus-reminder@tonus')
    expect(lines).toContain(
      `DTSTAMP:${now
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '')}`,
    )
    expect(lines).toContain('DTSTART;TZID=Europe/Budapest:20261001T183000')
    expect(lines).toContain('DURATION:PT50M')
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TH,SA;COUNT=36')
    expect(lines).toContain('SUMMARY:Tónus – Pilates edzés')
    expect(lines).toContain('TRIGGER:-PT10M')
  })
  it('keeps every line within 75 octets', () => {
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
  })
  it('falls back to 18:30 for a bad time and honours another time', () => {
    const bad = buildReminderIcs({
      startDate: '2026-10-01',
      trainingDays: [4],
      reminderTime: '99:99',
      now,
    })!
    expect(bad).toContain('T183000')
    const other = buildReminderIcs({
      startDate: '2026-10-01',
      trainingDays: [4],
      reminderTime: '07:05',
      now,
    })!
    expect(other).toContain('20261001T070500')
  })
  it('returns null without training days', () => {
    expect(buildReminderIcs({ startDate: '2026-10-01', trainingDays: [], now })).toBeNull()
  })
})
