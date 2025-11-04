// src/shared/utils/shape.ts
export type ShapeType = 'square'|'circle'|'triangle'|'wave'

export function normalizeShape(input?: string): ShapeType {
  const s = (input || '').toLowerCase().trim()
  if (['square','rect','box'].includes(s)) return 'square'
  if (['circle','round','dot'].includes(s)) return 'circle'
  if (['triangle','tri'].includes(s)) return 'triangle'
  if (['wave','wavy','waveform','sine'].includes(s)) return 'wave'
  return 'square' // 기본값
}
