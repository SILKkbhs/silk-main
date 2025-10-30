'use client'
import React from 'react'

export type ShapeName = 'square'|'circle'|'triangle'|'wave'|'squiggle'|'leaf'|string

export default function ShapeOverlay({ shape }: { shape?: ShapeName }) {
  const stroke = 'rgba(0,0,0,0.55)'
  const fill   = 'rgba(255,255,255,0.18)'
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden>
      {shape === 'square'   && <rect   x="18" y="18" width="64" height="64" rx="10" fill={fill} stroke={stroke} strokeWidth={2} />}
      {shape === 'circle'   && <circle cx="50" cy="50" r="28" fill={fill} stroke={stroke} strokeWidth={2} />}
      {shape === 'triangle' && <path   d="M50 18 L80 78 L20 78 Z" fill={fill} stroke={stroke} strokeWidth={2} />}
      {shape === 'wave'     && <path   d="M5 60 C20 40, 30 80, 45 60 S70 40, 95 60" fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" />}
      {shape === 'squiggle' && <path   d="M15 55 C25 25, 45 85, 55 55 S85 25, 90 55" fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" />}
      {shape === 'leaf'     && <path   d="M50 18 C80 35,75 70,50 85 C25 70,20 35,50 18 Z" fill={fill} stroke={stroke} strokeWidth={2} />}
    </svg>
  )
}
