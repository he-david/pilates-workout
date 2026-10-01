import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { db } from '../src/data/db'
import { saveLog } from '../src/data/logs'
import type { Rating, SessionLog } from '../src/domain/types'
import { LogScreen } from '../src/screens/LogScreen'

const mkLog = (
  sessionId: string,
  day: number,
  rating: Rating,
  extra: Partial<SessionLog> = {},
) => ({
  sessionId,
  startedAt: new Date(2026, 8, day, 17).toISOString(),
  finishedAt: new Date(2026, 8, day, 18).toISOString(),
  durationSec: 3000,
  completed: [],
  usedEasier: [],
  rating,
  areas: [],
  ...extra,
})

async function renderLog() {
  const result = render(
    <MemoryRouter initialEntries={['/log']}>
      <LogScreen />
    </MemoryRouter>,
  )
  await waitFor(() => expect(result.container).not.toBeEmptyDOMElement())
}

describe('LogScreen', () => {
  beforeEach(async () => {
    await db.logs.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 1, 12))
  })
  afterEach(() => vi.useRealTimers())

  it('shows empty states but still the planned calendar', async () => {
    await renderLog()
    expect(screen.getByRole('heading', { name: 'Napló' })).toBeInTheDocument()
    expect(screen.getByText('0 edzés')).toBeInTheDocument()
    expect(screen.getByText('0 p')).toBeInTheDocument()
    expect(screen.getByText('0 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText(/Az első mentett edzés után/)).toBeInTheDocument()
    expect(screen.getByText(/A 4., 8. és 12. héten felmérjük/)).toBeInTheDocument()
    expect(document.querySelectorAll('[data-status="planned"]').length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[data-status="done"]')).toHaveLength(0)
  })

  it('shows stats, chart and records from saved logs', async () => {
    await saveLog(mkLog('w01-a', 24, 3))
    await saveLog(mkLog('w01-b', 26, 2))
    await saveLog(mkLog('w01-c', 29, 3))
    await saveLog(
      mkLog('w04-a', 30, 3, {
        bestHoldSec: { 'forearm-plank': 25 },
        usedEasier: ['roll-up'],
      }),
    )
    await saveLog(
      mkLog('w08-a', 30, 3, { bestHoldSec: { 'forearm-plank': 40 }, bestReps: { 'roll-up': 8 } }),
    )
    await renderLog()
    await screen.findByText('Alkartámasz')
    expect(screen.getByText('4 ó 10 p')).toBeInTheDocument()
    expect(screen.getByText('5 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText('Szeptember – október')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-status="done"]').length).toBe(4)
    expect(screen.getByText('1. hét')).toBeInTheDocument()
    const row = screen.getByText('Felgördülés').closest('div')?.parentElement as HTMLElement
    expect(within(row).getByText('8 tiszta ism.')).toBeInTheDocument()
    expect(within(row).getByText('könnyítve')).toBeInTheDocument()
    expect(screen.getByText('25 mp')).toBeInTheDocument()
    expect(screen.getByText('40 mp')).toBeInTheDocument()
  })
})
