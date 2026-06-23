// ============================================================
// AXIS — Quick Capture parser
// ------------------------------------------------------------
// Función pura, sin React. Extraída de QuickCapture para que
// pueda ser testeada de forma aislada.
//
// Convierte el texto crudo del input en { titulo, prioridad }.
// Si el texto empieza con !/ */-/ se interpreta como prefijo de
// prioridad. Si no, se aplica heurística suggestPriority por keywords.
// ============================================================

import { suggestPriority } from './smartDefaults'

export const PRIORIDAD_PREFIX = { '!': 'CRITICA', '*': 'ALTA', '-': 'BAJA' }

export function parseQuickInput(raw) {
  const trimmed = (raw || '').trim()
  if (!trimmed) return { titulo: '', prioridad: 'NORMAL', fromPrefix: false }
  const first = trimmed[0]
  if (PRIORIDAD_PREFIX[first]) {
    return {
      titulo: trimmed.slice(1).trimStart(),
      prioridad: PRIORIDAD_PREFIX[first],
      fromPrefix: true,
    }
  }
  return {
    titulo: trimmed,
    prioridad: suggestPriority(trimmed),
    fromPrefix: false,
  }
}
