import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { db } from '../src/data/db'
import { getSettings } from '../src/data/settings'
import { TodayScreen } from '../src/screens/TodayScreen'
import { headline } from '../src/screens/today/headline'

async function renderToday(path = '/') {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <TodayScreen />
    </MemoryRouter>,
  )
  await waitFor(() => expect(result.container).not.toBeEmptyDOMElement())
  return result
}

describe('TodayScreen', () => {
  beforeEach(async () => {
    await db.settings.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 1, 12)) // Thursday
  })
  afterEach(() => vi.useRealTimers())

  it('shows week 1 A with no logs', async () => {
    await renderToday()
    expect(screen.getByText('Csütörtök, október 1.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ma este edzésnap van')
    expect(screen.getByText(/1\. hét · A edzés · 1\/3/)).toBeInTheDocument()
    expect(screen.getByText('0 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText('0 / 3 kész')).toBeInTheDocument()
    expect(screen.getByText('H · Cs · Szo, 18:30')).toBeInTheDocument()
    expect(screen.queryByLabelText(/sorozat/)).toBeNull()
  })

  it('links the hero to the next session', async () => {
    await renderToday()
    expect(screen.getByRole('link', { name: 'Edzés megnyitása' })).toHaveAttribute(
      'href',
      '/session/w01-a',
    )
  })

  it('renders seven week days with today marked', async () => {
    await renderToday()
    const today = screen.getByLabelText('Csütörtök, ma')
    expect(within(today).getByText('1')).toBeInTheDocument()
    expect(screen.getByLabelText('Szombat, tervezett edzés')).toBeInTheDocument()
  })

  it('previews week 3 B in dev with ?devDone=7', async () => {
    await renderToday('/?devDone=7')
    expect(screen.getByText(/3\. hét · B edzés · 2\/3/)).toBeInTheDocument()
    expect(screen.getByText('7 / 36 edzés')).toBeInTheDocument()
    expect(screen.getByText('3. hét a 12-ből')).toBeInTheDocument()
    expect(screen.getByText('1 / 3 kész')).toBeInTheDocument()
    expect(screen.getByLabelText('7 edzésnapos sorozat')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edzés megnyitása' })).toHaveAttribute(
      'href',
      '/session/w03-b',
    )
    expect(screen.getByText(/Következő: szombat/)).toBeInTheDocument()
    expect(screen.getByText(/A 4\. hét felmérő hét/)).toBeInTheDocument()
  })

  it('toggles the reminder', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    vi.useRealTimers()
    await renderToday()
    const toggle = screen.getByRole('button', { name: 'Emlékeztető bekapcsolva' })
    await userEvent.click(toggle)
    expect(await screen.findByRole('button', { name: 'Emlékeztető kikapcsolva' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect((await getSettings())?.reminderEnabled).toBe(false)
  })
})

describe('headline', () => {
  it.each([
    ['today', false, 'Ma este edzésnap van'],
    ['done', false, 'Mára megvagy, szép munka'],
    ['rest', false, 'Ma pihenőnap van'],
    ['today', true, 'Végigcsináltad a programot'],
  ] as const)('%s / complete=%s', (status, complete, text) => {
    expect(headline(status, complete)).toBe(text)
  })
})
