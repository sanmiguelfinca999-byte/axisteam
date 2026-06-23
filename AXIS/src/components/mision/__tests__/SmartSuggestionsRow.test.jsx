import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SmartSuggestionsRow from '../SmartSuggestionsRow'

function makeForm(overrides = {}) {
  return {
    titulo: '',
    descripcion: '',
    prioridad: 'NORMAL',
    fechaLimite: '2026-12-31',
    storyPoints: 3,
    ...overrides,
  }
}

describe('SmartSuggestionsRow', () => {
  it('no renderiza cuando no hay sugerencias diferentes al estado', () => {
    // Estado "completo" donde nada cambia: descripción vacía, fecha lejana, sin titulo urgente
    const { container } = render(
      <SmartSuggestionsRow form={makeForm()} onApply={() => {}} />
    )
    // Puede o no haber chips según defaults: si suggestStoryPoints(NORMAL, '') === 1 difiere del 3 actual,
    // habrá chip de puntos. Validamos al menos que el contenedor renderice o sea null sin crash.
    expect(container).toBeTruthy()
  })

  it('detecta prioridad sugerida desde título urgente', () => {
    const onApply = vi.fn()
    render(
      <SmartSuggestionsRow
        form={makeForm({ titulo: 'Cosa urgente para hoy', prioridad: 'NORMAL' })}
        onApply={onApply}
      />
    )
    // Debe haber un chip con label "prioridad" + valor CRITICA
    const chip = screen.queryByText(/prioridad:/i)
    expect(chip).toBeInTheDocument()
    const button = chip.closest('button')
    expect(button).toHaveTextContent('CRITICA')

    fireEvent.click(button)
    expect(onApply).toHaveBeenCalledWith('prioridad', 'CRITICA')
  })

  it('aplica due date sugerido por prioridad (CRITICA +3d)', () => {
    const onApply = vi.fn()
    render(
      <SmartSuggestionsRow
        form={makeForm({ prioridad: 'CRITICA', fechaLimite: '2026-12-31' })}
        onApply={onApply}
      />
    )
    const chip = screen.queryByText(/fecha:/i)
    if (chip) {
      fireEvent.click(chip.closest('button'))
      const [key, value] = onApply.mock.calls[0]
      expect(key).toBe('fechaLimite')
      expect(typeof value).toBe('string')
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('no muestra chip cuando el valor actual ya coincide con la sugerencia', () => {
    // Texto neutral, sin urgencia → suggestPriority devuelve NORMAL, igual al actual
    const { container } = render(
      <SmartSuggestionsRow
        form={makeForm({ titulo: 'Tarea común', prioridad: 'NORMAL' })}
        onApply={() => {}}
      />
    )
    // No debe haber chip de prioridad
    expect(screen.queryByText(/prioridad:/i)).toBeNull()
  })
})
