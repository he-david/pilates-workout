import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { program } from '../src/content/program'
import { db } from '../src/data/db'
import { saveLog } from '../src/data/logs'
import type { SessionLog } from '../src/domain/types'
import { ExerciseScreen } from '../src/screens/ExerciseScreen'
import { ProgramScreen } from '../src/screens/ProgramScreen'
import { SessionScreen } from '../src/screens/SessionScreen'
import { TodayScreen } from '../src/screens/TodayScreen'

// Thursday 2026-10-01, a default training day (Mon/Thu/Sat)
const NOW = new Date(2026, 9, 1, 12)

function log(sessionId: string, finished: Date, extra: Partial<SessionLog> = {}): SessionLog {
  return {
    sessionId,
    startedAt: new Date(finished.getTime() - 3000_000).toISOString(),
    finishedAt: finished.toISOString(),
    durationSec: 3000,
    completed: [],
    usedEasier: [],
    rating: 3,
    areas: [],
    ...extra,
  }
}

async function renderAt(path: string) {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<TodayScreen />} />
        <Route path="/program" element={<ProgramScreen />} />
        <Route path="/session/:id" element={<SessionScreen />} />
        <Route path="/exercise/:id" element={<ExerciseScreen />} />
      </Routes>
    </MemoryRouter>,
  )
  await waitFor(() => expect(result.container).not.toBeEmptyDOMElement())
}

describe('logged progress (real Dexie logs)', () => {
  beforeEach(async () => {
    await db.logs.clear()
    await db.settings.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it('Today advances to the next session and counts streak', async () => {
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9)))
    await renderAt('/')
    expect(screen.getByText(/1\. hét · B edzés/)).toBeInTheDocument()
    expect(screen.getByText('1 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByLabelText('1 edzésnapos sorozat')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mára megvagy')
    expect(screen.getByLabelText('Csütörtök, kész')).toBeInTheDocument()
  })

  it('a session done twice counts once; unknown ids and off-days are harmless', async () => {
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9)))
    await saveLog(log('w01-a', new Date(2026, 9, 1, 10)))
    await saveLog(log('gone-99', new Date(2026, 8, 30, 10))) // Wednesday, not in program
    await renderAt('/')
    expect(screen.getByText('1 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText(/1\. hét · B edzés/)).toBeInTheDocument()
  })

  it('Today shows the finished program when all 36 are logged', async () => {
    for (const s of program) await saveLog(log(s.id, new Date(2026, 9, 1, 9)))
    await renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Végigcsináltad a programot',
    )
    expect(screen.getByText('36 / 36 edzés')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edzés megnyitása' })).toBeNull()
  })

  it('Program marks done sessions and counts', async () => {
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9)))
    await saveLog(log('nope', new Date(2026, 9, 1, 9)))
    await renderAt('/program')
    expect(screen.getByText('1 / 36')).toBeInTheDocument()
    expect(
      screen.getByText('A · Légzés & középtest', { selector: 'span.line-through' }),
    ).toBeInTheDocument()
  })

  it('Program shows 36 / 36 when complete', async () => {
    for (const s of program) await saveLog(log(s.id, new Date(2026, 9, 1, 9)))
    await renderAt('/program')
    expect(screen.getByText('36 / 36')).toBeInTheDocument()
  })

  it('Session overview shows a done state and "Újra" only for logged sessions', async () => {
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9)))
    await renderAt('/session/w01-a')
    expect(screen.getByText('Kész · október 1.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Újra/ })).toHaveAttribute('href', '/player/w01-a')
  })

  it('Session overview of an unlogged session keeps Indítás', async () => {
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9)))
    await renderAt('/session/w01-b')
    expect(screen.queryByText(/^Kész/)).toBeNull()
    expect(screen.getByRole('link', { name: /Indítás/ })).toBeInTheDocument()
  })

  it('Exercise detail shows "Te legutóbb" from real logs', async () => {
    const first = program[0]
    const id = first?.main[0]?.exerciseId ?? ''
    await saveLog(log('w01-a', new Date(2026, 9, 1, 9), { completed: [id], usedEasier: [id] }))
    await renderAt(`/exercise/${id}?session=w01-a`)
    const label = screen.getByText('Te legutóbb')
    const box = label.parentElement as HTMLElement
    expect(within(box).getByText(/1\. hét: .*könnyítéssel/)).toBeInTheDocument()
  })
})
