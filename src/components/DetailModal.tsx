// src/components/DetailModal.tsx
'use client'
import React, { useEffect, useRef, useState } from 'react'
import ShapePreview from '@/components/ui/ShapePreview'
import { stopAllAudios } from '@/utils/audio'
import { getSoundUrl } from '@/utils/sound'
import { auth, rtdb } from '@/lib/firebase'                // ✅ auth 추가
import { ref as dbRef, runTransaction, remove } from 'firebase/database' // ✅ remove 추가

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
  likes?: number
  authorName?: string
}

export default function DetailModal({
  open, item, onClose,
}: { open: boolean; item: DetailItem | null; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [likes, setLikes] = useState<number>(item?.likes ?? 0)
  const [liking, setLiking] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)            // ✅ 관리자 여부

  // 관리자 판정: 커스텀 클레임 role === 'admin'
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) return setIsAdmin(false)
      const t = await u.getIdTokenResult()
      setIsAdmin(t.claims?.role === 'admin')
    })
    return () => unsub()
  }, [])

  useEffect(() => { setLikes(item?.likes ?? 0) }, [item?.id, item?.likes])

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
      await runTransaction(ref, (cur: any) => (typeof cur === 'number' ? cur + 1 : 1))
      setLikes(v => (v ?? 0) + 1)
    } catch (err) {
      alert('공감 처리 실패')
      console.error(err)
    } finally {
      setLiking(false)
    }
  }

  // ✅ 관리자 전용 삭제
  const onDelete = async () => {
    if (!confirm('이 카드를 삭제할까요? 삭제 후 되돌릴 수 없습니다.')) return
    try {
      await remove(dbRef(rtdb, `emotions/${item.id}`))
      // (선택) 관련 스토리지 정리는 Cloud Functions onDelete 트리거로 처리 추천
      onClose()
      alert('삭제되었습니다.')
    } catch (e) {
      console.error(e)
      alert('삭제 실패: 권한 또는 네트워크 상태를 확인하세요.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="relative h-56 bg-white grid place-items-center">
          <ShapePreview shape={(item.shape as any) ?? 'square'} color={item.color ?? '#7777ee'} size={140} />
          <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-black/30 text-white">{date}</div>
          <div className="absolute top-3 right-3 text-black/80 text-lg">{(item.lat && item.lng) ? '📍' : ''}</div>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-400">작성자 : {item.authorName || '익명'}</div>
          <div className="text-sm text-gray-500">{item.shape} · {item.sound}</div>
          <div className="text-lg font-bold">
            {item.label ? `${item.label}${scoreText}` : '분석 필요'}
          </div>

          <audio
            ref={audioRef}
            key={item?.sound}
            controls
            preload="none"
            onPlay={() => stopAllAudios(audioRef.current!)}
            className="w-full"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm text-gray-600 select-none">공감 {likes ?? 0}</div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                  title="관리자 전용 삭제"
                >
                  삭제
                </button>
              )}
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
