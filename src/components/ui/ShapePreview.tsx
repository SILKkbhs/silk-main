'use client'
import React from 'react'

type Shape = 'square' | 'circle' | 'triangle' | 'diamond' | 'wave' | string

type Props = {
  shape?: Shape
  color?: string
  size?: number
  className?: string
}

/**
 * 배경은 그리지 않고, 주어진 도형 내부만 color로 채워서 렌더한다.
 * 요구사항: wave는 채우기 어려우니 렌더 단계에서 diamond로 대체한다.
 */
const ShapePreview: React.FC<Props> = ({
  shape = 'square',
  color = '#7777ee',
  size = 120,
  className = '',
}) => {
  const s = Math.max(40, size)
  const stroke = 'none'

  // wave → diamond로 강제 맵핑
  const normalized: Exclude<Shape, 'wave'> =
    (shape === 'wave' ? 'diamond' : shape) as any

  if (normalized === 'circle') {
    const r = s * 0.35
    return (
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        role="img"
        aria-label="circle"
        className={className}
      >
        <circle cx={s / 2} cy={s / 2} r={r} fill={color} stroke={stroke} />
      </svg>
    )
  }

  if (normalized === 'triangle') {
    const pad = s * 0.15
    const p1 = `${s / 2},${pad}`
    const p2 = `${s - pad},${s - pad}`
    const p3 = `${pad},${s - pad}`
    return (
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        role="img"
        aria-label="triangle"
        className={className}
      >
        <polygon points={`${p1} ${p2} ${p3}`} fill={color} stroke={stroke} />
      </svg>
    )
  }

  if (normalized === 'diamond') {
    const pad = s * 0.15
    const cx = s / 2
    const cy = s / 2
    const r = (s - pad * 2) / 2
    const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
    return (
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        role="img"
        aria-label="diamond"
        className={className}
      >
        <polygon points={pts} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // default: square
  const pad = s * 0.15
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      role="img"
      aria-label="square"
      className={className}
    >
      <rect
        x={pad}
        y={pad}
        width={s - pad * 2}
        height={s - pad * 2}
        fill={color}
        stroke={stroke}
        rx={8}
        ry={8}
      />
    </svg>
  )
}

export default ShapePreview
