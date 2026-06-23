import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KeyboardShortcuts from '../KeyboardShortcuts'

describe('KeyboardShortcuts', () => {
  it('no renderiza cuando open=false', () => {
    const { container } = render(<KeyboardShortcuts open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renderiza secciones y atajos cuando open=true', () => {
    render(<KeyboardShortcuts open onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Globales')).toBeInTheDocument()
    expect(screen.getByText('Foco')).toBeInTheDocument()
    expect(screen.getByText('Misiones')).toBeInTheDocument()
    expect(screen.getByText(/Abrir Now Mode/)).toBeInTheDocument()
  })

  it('ESC dispara onClose', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcuts open onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tiene aria-modal y aria-labelledby para a11y', () => {
    render(<KeyboardShortcuts open onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'ks-title')
  })
})
