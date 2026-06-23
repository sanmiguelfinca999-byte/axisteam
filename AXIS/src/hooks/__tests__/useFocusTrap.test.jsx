import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from '../useFocusTrap'

function TrapDialog({ open }) {
  const ref = useFocusTrap(open)
  if (!open) return <button>External</button>
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="test">
      <button>First</button>
      <button>Middle</button>
      <button>Last</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  it('enfoca el primer focusable al abrir', () => {
    render(<TrapDialog open />)
    expect(document.activeElement?.textContent).toBe('First')
  })

  it('Tab desde el último vuelve al primero (ciclo)', async () => {
    const user = userEvent.setup()
    render(<TrapDialog open />)
    const last = screen.getByText('Last')
    last.focus()
    await user.tab()
    expect(document.activeElement?.textContent).toBe('First')
  })

  it('Shift+Tab desde el primero salta al último', async () => {
    const user = userEvent.setup()
    render(<TrapDialog open />)
    const first = screen.getByText('First')
    first.focus()
    await user.tab({ shift: true })
    expect(document.activeElement?.textContent).toBe('Last')
  })
})
