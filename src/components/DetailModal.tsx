'use client'
import React, { useEffect } from 'react'
import ShapeOverlay from '@/components/visuals/ShapeOverlay'

const SOUND_SRC: Record<string, string> = {
  chime: '/sounds/chime.mp3',
  rain: '/sounds/rain.mp3',
  piano: '/sounds/piano.mp3',
  drum: '/sounds/drum.mp3',
}

export type DetailItem = {
  id: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  timestamp?: number
  lat?: number
  lng?: number
}

export default function DetailModal({
  open, item, onClose,
}: { open: boolean; item: DetailItem|null; onClose: () => void }) {
  const src = item?.sound ? SOUND_SRC[item.sound] : undefined

  useEffect(() => {
    if (!open || !src) return
    const audio = new Audio(src)
    audio.play().catch(() => {})
    return () => { audio.pause(); audio.currentTime = 0 }
  }, [open, src])

  if (!open || !item) return null
  const date = item.timestamp ? new Date(item.timestamp).toLocaleString('ko-KR') : '-'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="relative h-56" style={{ background: item.color }}>
          <ShapeOverlay shape={item.shape} />
          <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-black/30 text-white">{date}</div>
          <div className="absolute top-3 right-3 text-white text-lg">{(item.lat&&item.lng)?'📍':''}</div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm text-gray-500">{item.shape} · {item.sound}</div>
          <div className="text-lg font-bold">
            {item.label ? `${item.label}${typeof item.score==='number'?` (${Math.round(item.score*100)}%)`:''}` : '분석 필요'}
          </div>
          {src && <audio controls className="w-full mt-2"><source src={src} type="audio/mpeg" /></audio>}
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
