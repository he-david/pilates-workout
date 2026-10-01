import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { exercises } from '../src/content/exercises'
import { program } from '../src/content/program'
import { sessionItems } from '../src/domain/todaySummary'
import { ExerciseScreen } from '../src/screens/ExerciseScreen'

async function renderAt(path: string) {
  const result = render(
    <MemoryRouter initialEntries={['/', path]} initialIndex={1}>
      <Routes>
        <Route path="/" element={<div>Kezdőlap</div>} />
        <Route path="/exercise/:id" element={<ExerciseScreen />} />
        <Route path="/session/:id" element={<div>Edzés</div>} />
      </Routes>
    </MemoryRouter>,
  )
  await waitFor(() => expect(result.container).not.toBeEmptyDOMElement())
  return result
}

describe('ExerciseScreen', () => {
  it('shows the full detail for an exercise inside a session', async () => {
    await renderAt('/exercise/roll-up?session=w03-b')
    expect(screen.getByRole('heading', { level: 1, name: 'Felgördülés' })).toBeInTheDocument()
    expect(screen.getByText(/^Gyakorlat \d+ \/ \d+$/)).toBeInTheDocument()
    expect(screen.getByText(/^Roll Up · .* · kb\. \d+ perc$/)).toBeInTheDocument()
    expect(screen.getByText('Has, gerinc')).toBeInTheDocument()
    expect(screen.getByText('3 le · 3 fel')).toBeInTheDocument()
    expect(screen.getByText('Belégzés:').tagName).toBe('B')
    expect(screen.getByText('Figyelj rá')).toBeInTheDocument()
    expect(screen.getByText('Könnyítés')).toBeInTheDocument()
    expect(screen.getByText('Nehezítés')).toBeInTheDocument()
    expect(screen.getByText('[Bemutató videó helye]')).toBeInTheDocument()
  })

  it('hides "Te legutóbb" when there are no logs', async () => {
    await renderAt('/exercise/roll-up?session=w03-b')
    expect(screen.queryByText('Te legutóbb')).not.toBeInTheDocument()
  })

  it('shows the exercise generically without a session', async () => {
    await renderAt('/exercise/roll-up')
    expect(screen.getByText('Roll Up')).toBeInTheDocument()
    expect(screen.queryByText(/^Gyakorlat \d+/)).not.toBeInTheDocument()
  })

  it('goes back in history', async () => {
    await renderAt('/exercise/roll-up')
    await userEvent.click(screen.getByRole('button', { name: 'Vissza' }))
    expect(screen.getByText('Kezdőlap')).toBeInTheDocument()
  })

  it('shows not-found for unknown exercises', async () => {
    await renderAt('/exercise/nope')
    expect(
      within(screen.getByRole('main')).getByText('Nem található a gyakorlat'),
    ).toBeInTheDocument()
  })

  it('renders every exercise of every session', async () => {
    for (const session of program) {
      for (const [i, item] of sessionItems(session).entries()) {
        const { unmount } = await renderAt(`/exercise/${item.exerciseId}?session=${session.id}`)
        const ex = exercises.find((e) => e.id === item.exerciseId)!
        expect(screen.getByRole('heading', { level: 1, name: ex.nameHu })).toBeInTheDocument()
        expect(screen.getByText(new RegExp(`^Gyakorlat ${i + 1} / `))).toBeInTheDocument()
        unmount()
      }
    }
  })
})
