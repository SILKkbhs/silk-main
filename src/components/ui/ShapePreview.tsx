// src/components/ui/ShapePreview.tsx
'use client'
import React from 'react'

type Shape =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'heart'
  | 'droplet'
  | 'wave'        // 과거 데이터 호환용
  | (string & {}) // 확장 대비

type Props = {
  shape?: Shape
  color?: string
  size?: number
  className?: string
}

/**
 * 배경은 그리지 않는다.
 * 도형 내부만 color로 채운다.
 * 호환: 'wave'는 면 채우기가 어려워 렌더 단계에서 'diamond'로 매핑한다.
 */
const ShapePreview: React.FC<Props> = ({
  shape = 'square',
  color = '#7777ee',
  size = 120,
  className = '',
}) => {
  const s = Math.max(40, size)
  const pad = s * 0.15
  const stroke = 'none'

  // 과거 데이터 호환
  const k = (shape === 'wave' ? 'diamond' : shape) as Shape

  // square
  if (k === 'square') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="square">
        <rect x={pad} y={pad} width={s - pad * 2} height={s - pad * 2} rx={8} ry={8} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // circle
  if (k === 'circle') {
    const r = (s - pad * 2) / 2
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="circle">
        <circle cx={s / 2} cy={s / 2} r={r} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // triangle (위쪽이 뾰족)
  if (k === 'triangle') {
    const p1 = `${s / 2},${pad}`
    const p2 = `${s - pad},${s - pad}`
    const p3 = `${pad},${s - pad}`
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="triangle">
        <polygon points={`${p1} ${p2} ${p3}`} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // diamond (마름모)
  if (k === 'diamond') {
    const cx = s / 2, cy = s / 2, r = (s - pad * 2) / 2
    const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="diamond">
        <polygon points={pts} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // star (5각별)
  if (k === 'star') {
    const cx = s / 2, cy = s / 2
    const R = (s - pad * 2) / 2        // 바깥 반지름
    const r = R * 0.5                   // 안쪽 반지름
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const ang = (-90 + i * 36) * (Math.PI / 180)
      const rad = i % 2 === 0 ? R : r
      const x = cx + rad * Math.cos(ang)
      const y = cy + rad * Math.sin(ang)
      pts.push(`${x},${y}`)
    }
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="star">
        <polygon points={pts.join(' ')} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // heart (하트)
  if (k === 'heart') {
    // 정사각형 뷰박스 내 베지어 하트
    const w = s, h = s
    const x = w / 2, y = h / 2
    const top = y - (s * 0.12)
    const path = `
      M ${x},${top}
      C ${x + s * 0.25},${top - s * 0.18} ${w - pad},${y - s * 0.05} ${x},${h - pad}
      C ${pad},${y - s * 0.05} ${x - s * 0.25},${top - s * 0.18} ${x},${top}
      Z
    `
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="heart">
        <path d={path} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // droplet (물방울)
  if (k === 'droplet') {
    const cx = s / 2
    const top = pad
    const bottom = s - pad
    const ctrl = s * 0.28
    const path = `
      M ${cx},${top}
      C ${cx + ctrl},${top + ctrl} ${cx + ctrl},${bottom - ctrl} ${cx},${bottom}
      C ${cx - ctrl},${bottom - ctrl} ${cx - ctrl},${top + ctrl} ${cx},${top}
      Z
    `
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="droplet">
        <path d={path} fill={color} stroke={stroke} />
      </svg>
    )
  }

  // fallback: square
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className={className} role="img" aria-label="square">
      <rect x={pad} y={pad} width={s - pad * 2} height={s - pad * 2} rx={8} ry={8} fill={color} stroke={stroke} />
    </svg>
  )
}

export default ShapePreview
