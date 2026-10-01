import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '../src/app'

describe('App', () => {
  it('renders the title', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Tónus' })).toBeInTheDocument()
  })
})
