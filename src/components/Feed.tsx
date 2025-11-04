'use client'
import React, { useEffect, useState } from 'react'
import { ref, query, orderByChild, limitToLast, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'
// import ShapeOverlay from '@/components/visuals/ShapeOverlay' // ⛔️ 사용 안함: 미리보기와 불일치 원인이던 레이어
import DetailModal from '@/components/DetailModal'
import ShapePreview from '@/components/ui/ShapePreview'
import { normalizeShape } from '@/utils/shape'
import { stopAllAudios } from '@/utils/audio'   // ✅ 추가: 겹침 방지용

type Emotion = {
  id: string
  userId?: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  timestamp?: number
  likes?: number
  lat?: number
  lng?: number
}

export default function Feed() {
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Emotion | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(ref(rtdb, 'emotions'), orderByChild('timestamp'), limitToLast(50))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => { list.push({ id: c.key ?? 'missing-id', ...(c.val() as Omit<Emotion,'id'>) }) })
      const safe = list
        .filter(v => typeof v?.timestamp === 'number')
        .map(v => ({
          id: v.id,
          userId: v.userId ?? 'anonymous',
          color: v.color ?? '#eeeeee',
          shape: v.shape ?? '-',
          sound: v.sound ?? '-',
          label: v.label,
          score: v.score,
          timestamp: v.timestamp!,
          likes: v.likes ?? 0,
          lat: v.lat, lng: v.lng,
        }))
        .sort((a,b) => b.timestamp - a.timestamp)
      setItems(safe); setLoading(false)
    }, e => { setErr(e?.message || '피드를 불러오지 못했습니다.'); setLoading(false) })
    return () => off()
  }, [])

  if (loading) return <div className="grid place-items-center h-[60vh] text-gray-500 text-lg">⏳ 불러오는 중…</div>
  if (err) return <div className="grid place-items-center h-[60vh] text-red-500 text-lg font-bold">❌ {err}</div>

  const displayItems = items.slice(0, 6)

  const getColorForLabel = (label: string) => {
    switch (label) {
      case '긍정': return 'text-green-500'
      case '차분': return 'text-blue-500'
      case '활기': return 'text-yellow-500'
      case '우울': return 'text-red-500'
      case '불안': return 'text-pink-500'
      default: return 'text-gray-500'
    }
  }

  // ✅ 모달 열 때 기존 재생 중인 오디오 전부 정지
  const openModal = (it: Emotion) => {
    stopAllAudios()
    setCurrent(it)
    setOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pt-20">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-4 border-indigo-400 pb-3">실크 갤러리</h2>

      {displayItems.length === 0 ? (
        <p className="col-span-full text-center text-gray-500 text-md p-8 bg-gray-100 rounded-xl shadow-inner">
          아직 공유된 실크 기록이 부족합니다.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {displayItems.map(it => {
            const hasLabel = !!it.label
            const shape = normalizeShape(it.shape)                 // ✅ 항상 동일 규격
            const color = it.color ?? '#8877E6'

            return (
              <button
                key={it.id}
                onClick={() => openModal(it)}
                className="aspect-square rounded-3xl shadow-xl border border-gray-100 overflow-hidden
                           transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer text-left"
              >
                {/* ⬇️ 상단: 미리보기와 동일한 렌더러 사용 */}
                <div className="relative h-2/3 bg-white grid place-items-center">
                  <ShapePreview shape={shape} color={color} size={88} />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/30 rounded-full text-xs text-white font-medium z-10">
                    {new Date(it.timestamp!).toLocaleDateString('ko-KR').substring(5, 12)}
                  </div>
                </div>

                {/* 하단 정보 */}
                <div className="h-1/3 p-3 flex flex-col justify-center bg-white">
                  <div className="text-xs text-gray-500 font-medium truncate mb-1">
                    {shape} · {it.sound}
                  </div>
                  <div className="text-lg font-extrabold truncate">
                    {hasLabel ? (
                      <span className={getColorForLabel(it.label!)}>{it.label}</span>
                    ) : (
                      <span className="text-gray-400">분석 필요</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {hasLabel && `AI ${Math.round((it.score ?? 0) * 100)}%`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <DetailModal open={open} item={current} onClose={() => setOpen(false)} />
    </div>
  )
}
