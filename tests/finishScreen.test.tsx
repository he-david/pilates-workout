import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { db } from '../src/data/db'
import { listLogs } from '../src/data/logs'
import type { FinishSummary } from '../src/domain/player'
import { FinishScreen } from '../src/screens/FinishScreen'

const summary: FinishSummary = {
  sessionId: 'w01-a',
  startedAt: Date.UTC(2026, 9, 1, 8, 0, 0),
  finishedAt: Date.UTC(2026, 9, 1, 8, 51, 20),
  durationSec: 3080,
  completed: ['a', 'b'],
  usedEasier: [],
}

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

function renderFinish(state: FinishSummary | null) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/finish/w01-a', state }]}>
      <Routes>
        <Route path="/finish/:id" element={<FinishScreen />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FinishScreen', () => {
  beforeEach(() => db.logs.clear())

  it('redirects to Today without router state', async () => {
    renderFinish(null)
    expect(await screen.findByTestId('where')).toHaveTextContent('/')
  })

  it('shows the summary', () => {
    renderFinish(summary)
    expect(screen.getByText('Szép munka!')).toBeInTheDocument()
    expect(screen.getByText('51:20')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Pont jó/ })).toBeChecked()
  })

  it('saves with no areas when none are picked', async () => {
    const user = userEvent.setup()
    renderFinish(summary)
    expect(screen.getByRole('button', { name: 'Has' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Mentés a naplóba' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'))
    expect((await listLogs())[0]?.areas).toEqual([])
  })

  it('saves the log and goes to Today', async () => {
    const user = userEvent.setup()
    renderFinish(summary)
    await user.click(screen.getByRole('radio', { name: /Nehéz/ }))
    await user.click(screen.getByRole('button', { name: 'Hát' }))
    await user.type(screen.getByLabelText('Jegyzet'), 'Rendben')
    await user.click(screen.getByRole('button', { name: 'Mentés a naplóba' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'))
    const logs = await listLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      sessionId: 'w01-a',
      rating: 4,
      areas: ['Hát'],
      note: 'Rendben',
      durationSec: 3080,
    })
  })

  it('hides the measurements outside assessment weeks', () => {
    renderFinish(summary)
    expect(screen.queryByLabelText('Plank tartás (mp)')).toBeNull()
  })

  it('saves assessment measurements', async () => {
    const user = userEvent.setup()
    const w4 = { ...summary, sessionId: 'w04-a' }
    render(
      <MemoryRouter initialEntries={[{ pathname: '/finish/w04-a', state: w4 }]}>
        <Routes>
          <Route path="/finish/:id" element={<FinishScreen />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    )
    const plank = screen.getByLabelText('Plank tartás (mp)')
    expect(plank).toHaveAttribute('inputmode', 'numeric')
    await user.type(plank, '40')
    await user.type(screen.getByLabelText('Tiszta Roll Up ismétlés'), '-5')
    await user.click(screen.getByRole('button', { name: 'Mentés a naplóba' }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/'))
    const [log] = await listLogs()
    expect(log?.bestHoldSec).toEqual({ 'forearm-plank': 40 })
    expect(log?.bestReps).toBeUndefined()
  })
})
