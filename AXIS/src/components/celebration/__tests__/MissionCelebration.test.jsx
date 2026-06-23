import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import MissionCelebration from '../MissionCelebration'

describe('MissionCelebration', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('no renderiza nada por defecto', () => {
    const { container } = render(<MissionCelebration />)
    expect(container.firstChild).toBeNull()
  })

  it('aparece al recibir axis:mission:completed', () => {
    render(<MissionCelebration />)
    act(() => {
      window.dispatchEvent(new CustomEvent('axis:mission:completed', {
        detail: { titulo: 'Mision Demo', prioridad: 'CRITICA' },
      }))
    })
    expect(screen.getByText('Mision Demo')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('auto-dismiss después de ~1.8s', () => {
    render(<MissionCelebration />)
    act(() => {
      window.dispatchEvent(new CustomEvent('axis:mission:completed', {
        detail: { titulo: 'X', prioridad: 'NORMAL' },
      }))
    })
    expect(screen.queryByText('X')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('X')).toBeNull()
  })

  it('usa role=status aria-live=polite para screen readers', () => {
    render(<MissionCelebration />)
    act(() => {
      window.dispatchEvent(new CustomEvent('axis:mission:completed', {
        detail: { titulo: 'A11y test', prioridad: 'ALTA' },
      }))
    })
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
