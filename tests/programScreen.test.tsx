import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { ProgramScreen } from '../src/screens/ProgramScreen'

async function renderProgram(path = '/program') {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <ProgramScreen />
    </MemoryRouter>,
  )
  await waitFor(() => expect(result.container).not.toBeEmptyDOMElement())
  return result
}

describe('ProgramScreen', () => {
  it('strikes through done sessions only', async () => {
    await renderProgram('/program?devDone=7')
    const done = screen.getByText('A · Légzés & középtest', { selector: 'span.line-through' })
    expect(done).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /B · Core & gerinc/ }).querySelector('.line-through'),
    ).toBeNull()
  })

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 1, 12))
  })
  afterEach(() => vi.useRealTimers())

  it('shows progress, 3 phases and locked highlights', async () => {
    await renderProgram()
    expect(screen.getByText('0 / 36')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Alapozás',
      'Építés',
      'Kihívás',
    ])
    expect(screen.getByText(/1\. fázis · 1–4\. hét · Folyamatban/)).toBeInTheDocument()
    const hl = screen.getAllByRole('list', { name: 'Kiemelt gyakorlatok' })
    expect(hl).toHaveLength(2)
    expect(within(hl[0] as HTMLElement).getAllByRole('listitem')).toHaveLength(4)
  })

  it('expands the current week by default and links sessions', async () => {
    await renderProgram()
    expect(screen.getByRole('button', { name: /1\. hét · e hét/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByRole('link', { name: /A · Légzés & középtest → ma/ })).toHaveAttribute(
      'href',
      '/session/w01-a',
    )
    expect(screen.getByRole('button', { name: /4\. hét · Felmérő hét/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('toggles a week', async () => {
    await renderProgram()
    const btn = screen.getByRole('button', { name: /2\. hét/ })
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })
})
