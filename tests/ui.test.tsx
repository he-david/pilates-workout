import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BottomNav, Ring } from '../src/ui'

describe('BottomNav', () => {
  it('marks the current tab active', () => {
    render(
      <MemoryRouter initialEntries={['/program']}>
        <BottomNav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Program' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Ma' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Napló' })).not.toHaveAttribute('aria-current')
  })
})

describe('Ring', () => {
  it('offsets the dash by the remaining progress', () => {
    const { container } = render(<Ring progress={0.25} />)
    const progress = container.querySelectorAll('circle')[1]
    const c = 2 * Math.PI * 28.5
    expect(Number(progress?.getAttribute('stroke-dashoffset'))).toBeCloseTo(c * 0.75)
  })
})
