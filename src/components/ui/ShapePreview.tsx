// src/shared/components/ui/ShapePreview.tsx
import React from 'react'

export type ShapeType = 'square' | 'circle' | 'wave' | 'triangle'

type Props = {
  shape: ShapeType
  color: string
  size?: number
  className?: string
}

export default function ShapePreview({ shape, color, size = 120, className }: Props) {
  const s = size
  const stroke = '#00000010'

  if (shape === 'square') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="정사각형 미리보기">
        <rect x="8" y="8" width={s-16} height={s-16} rx="16" fill={color} stroke={stroke} />
      </svg>
    )
  }

  if (shape === 'circle') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="원형 미리보기">
        <circle cx={s/2} cy={s/2} r={(s/2)-12} fill={color} stroke={stroke} />
      </svg>
    )
  }

  if (shape === 'triangle') {
    const pad = 10
    const points = `${s/2},${pad} ${s-pad},${s-pad} ${pad},${s-pad}`
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="삼각형 미리보기">
        <polygon points={points} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // wave
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="웨이브 미리보기">
      <path
        d={`
          M 0 ${s*0.55}
          C ${s*0.15} ${s*0.35}, ${s*0.35} ${s*0.75}, ${s*0.5} ${s*0.55}
          C ${s*0.65} ${s*0.35}, ${s*0.85} ${s*0.75}, ${s} ${s*0.55}
          L ${s} ${s} L 0 ${s} Z
        `}
        fill={color}
        stroke={stroke}
      />
    </svg>
  )
}
