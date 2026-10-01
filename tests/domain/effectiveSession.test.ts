import { describe, expect, it } from 'vitest'
import { program } from '../../src/content/program'
import { effectiveSession } from '../../src/domain/effectiveSession'
import type { Rating, SessionLog } from '../../src/domain/types'

const log = (sessionId: string, rating: Rating, n: number): SessionLog => ({
  sessionId,
  startedAt: `2026-09-${10 + n}T10:00:00.000Z`,
  finishedAt: `2026-09-${10 + n}T10:50:00.000Z`,
  durationSec: 3000,
  completed: [],
  usedEasier: [],
  rating,
  areas: [],
})

describe('effectiveSession', () => {
  it('is undefined for unknown ids', () => {
    expect(effectiveSession(program, 'nope', [])).toBeUndefined()
  })

  it('returns the authored session when there is no history', () => {
    const rx = effectiveSession(program, 'w01-a', [])
    expect(rx?.rule).toBe('none')
    expect(rx?.session).toBe(program[0])
  })

  it('applies the prescription only to the next session', () => {
    const logs = [log('w01-a', 5, 1), log('w01-b', 5, 2), log('w01-c', 5, 3), log('w02-a', 5, 4)]
    const next = effectiveSession(program, 'w02-b', logs)
    expect(next?.rule).toBe('hold')
    const later = effectiveSession(program, 'w03-b', logs)
    expect(later?.rule).toBe('none')
    expect(later?.session).toBe(program.find((s) => s.id === 'w03-b'))
    const done = effectiveSession(program, 'w01-a', logs)
    expect(done?.rule).toBe('none')
  })

  it('shortens holds after a 5 in the next session', () => {
    const logs = [log('w01-a', 5, 1), log('w01-b', 5, 2), log('w01-c', 5, 3), log('w02-a', 5, 4)]
    const authored = program.find((s) => s.id === 'w02-b')
    const rx = effectiveSession(program, 'w02-b', logs)
    expect(rx?.modified.length).toBeGreaterThan(0)
    expect(rx?.notes.length).toBe(1)
    expect(rx?.session).not.toBe(authored)
  })
})
