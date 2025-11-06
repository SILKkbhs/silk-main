// src/components/DetailModal.tsx
'use client'
import React, { useEffect, useRef } from 'react'
import ShapePreview from '@/components/ui/ShapePreview'
import { stopAllAudios } from '@/utils/audio'
import { getSoundUrl } from '@/utils/sound'

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
}: { open: boolean; item: DetailItem | null; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 모달이 열리거나 아이템/사운드가 바뀔 때: 자동재생 금지(소스만 세팅)
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    el.src = item?.sound ? (getSoundUrl(item.sound) ?? '') : ''
    // ❌ 절대 play() 호출하지 않음
  }, [open, item?.id, item?.sound])

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!open) {
      const el = audioRef.current
      if (el) { el.pause(); el.src = '' }
    }
  }, [open])

  if (!open || !item) return null

  const date = item.timestamp ? new Date(item.timestamp).toLocaleString('ko-KR') : '-'
  const scoreText = typeof item.score === 'number' ? ` (${Math.round(item.score * 100)}%)` : ''

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="relative h-56 bg-white grid place-items-center">
          <ShapePreview
            shape={(item.shape as any) ?? 'square'}
            color={item.color ?? '#7777ee'}
            size={140}
          />
          <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-black/30 text-white">{date}</div>
          <div className="absolute top-3 right-3 text-black/80 text-lg">{(item.lat&&item.lng)?'📍':''}</div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm text-gray-500">{item.shape} · {item.sound}</div>
          <div className="text-lg font-bold">
            {item.label ? `${item.label}${scoreText}` : '분석 필요'}
          </div>

          {/* 🎧 자동재생 X — 사용자 클릭 시에만 재생 */}
          <audio
            ref={audioRef}
            key={item?.sound}      // 다른 카드로 바꿀 때 src 새로고침
            controls
            preload="none"
            onPlay={() => stopAllAudios(audioRef.current!)}  // 겹침 방지
            className="w-full mt-2"
          />

          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">닫기</button>
          </div>
        </div>
      </div>
    </div>
  )
}
