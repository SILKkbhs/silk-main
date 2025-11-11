// src/components/DetailModal.tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import ShapePreview from '@/components/ui/ShapePreview'
import { stopAllAudios } from '@/utils/audio'
import { getSoundUrl } from '@/utils/sound'
import { rtdb } from '@/lib/firebase'
import { ref as dbRef, runTransaction } from 'firebase/database'

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
  likes?: number            // ✅ 추가
}

export default function DetailModal({
  open, item, onClose,
}: { open: boolean; item: DetailItem | null; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [likes, setLikes] = useState<number>(item?.likes ?? 0)   // ✅ 표시용
  const [liking, setLiking] = useState(false)

  useEffect(() => {                       // 아이템 변경 시 카운트 동기화
    setLikes(item?.likes ?? 0)
  }, [item?.id, item?.likes])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    el.src = item?.sound ? (getSoundUrl(item.sound) ?? '') : ''
  }, [open, item?.id, item?.sound])

  useEffect(() => {
    if (!open) {
      const el = audioRef.current
      if (el) { el.pause(); el.src = '' }
    }
  }, [open])

  if (!open || !item) return null

  const date = item.timestamp ? new Date(item.timestamp).toLocaleString('ko-KR') : '-'
  const scoreText = typeof item.score === 'number' ? ` (${Math.round(item.score * 100)}%)` : ''

  const onLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liking) return
    setLiking(true)
    try {
      const ref = dbRef(rtdb, `emotions/${item.id}/likes`)
      await runTransaction(ref, (cur: any) => typeof cur === 'number' ? cur + 1 : 1)
      setLikes(v => (v ?? 0) + 1)          // 낙관적 업데이트
    } catch (err) {
      alert('공감 처리 실패')
      console.error(err)
    } finally {
      setLiking(false)
    }
  }

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

        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-500">{item.shape} · {item.sound}</div>
          <div className="text-lg font-bold">
            {item.label ? `${item.label}${scoreText}` : '분석 필요'}
          </div>

          {/* 🎧 사용자 조작 시에만 재생 */}
          <audio
            ref={audioRef}
            key={item?.sound}
            controls
            preload="none"
            onPlay={() => stopAllAudios(audioRef.current!)}
            className="w-full"
          />

          {/* ✅ 공감 UI */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-gray-600 select-none">공감 {likes ?? 0}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLike}
                disabled={liking}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {liking ? '처리중…' : '💜 공감하기'}
              </button>
              <button onClick={onClose} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
