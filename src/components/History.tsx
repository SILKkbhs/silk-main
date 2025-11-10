// src/components/History.tsx
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, rtdb } from '@/lib/firebase'
import {
  ref as dbRef,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
} from 'firebase/database'
import ShapePreview from '@/components/ui/ShapePreview' // 프로젝트 경로에 맞게 조정
import DetailModal from '@/components/DetailModal'

type Emotion = {
  id: string
  userId?: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  timestamp?: number
  lat?: number
  lng?: number
}

// timestamp → number(ms) 정규화
function normalizeTs(t: unknown): number {
  if (typeof t === 'number') return t
  if (typeof t === 'string') {
    if (/^\d+$/.test(t)) {
      const n = Number(t)
      return n < 2_000_000_000 ? n * 1000 : n
    }
    const p = Date.parse(t)
    return Number.isFinite(p) ? p : 0
  }
  return 0
}

export default function History() {
  const [uid, setUid] = useState<string | null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  // 상세 모달
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Emotion | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        location.hash = '#login'
        return
      }
      setUid(u.uid)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    const q = query(
      dbRef(rtdb, 'emotions'),
      orderByChild('userId'),
      equalTo(uid),
      limitToLast(500)
    )
    const off = onValue(
      q,
      (snap) => {
        const list: Emotion[] = []
        snap.forEach((c) => {
          list.push(c.val() as Emotion)
        })

        const safe = list
          .map((v) => ({
            ...v,
            id: (v as any).id,
            userId: v.userId ?? 'anonymous',
            color: v.color ?? '#eeeeee',
            shape: v.shape ?? 'square',
            sound: v.sound ?? '-',
            timestamp: normalizeTs((v as any)?.timestamp),
          }))
          .filter((v) => (v.timestamp as number) > 0)
          .sort((a, b) => (b.timestamp as number) - (a.timestamp as number))

        setItems(safe)
        setLoading(false)
      },
      (e) => {
        setErr(e?.message || '히스토리를 불러오지 못했습니다.')
        setLoading(false)
      }
    )
    return () => off()
  }, [uid])

  // 날짜별 그룹
  const grouped = useMemo(() => {
    const map = new Map<string, Emotion[]>()
    for (const it of items) {
      const d = new Date(it.timestamp as number)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    // 최신 날짜가 위로
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }, [items])

  if (loading) return <div className="p-4 text-sm text-black/60">불러오는 중…</div>
  if (err) return <div className="p-4 text-sm text-red-600">에러: {err}</div>

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">내 히스토리</h2>

      {grouped.length === 0 && (
        <div className="text-sm text-black/60">기록이 없습니다.</div>
      )}

      {grouped.map(([date, arr]) => (
        <section key={date} className="mb-8">
          <div className="text-sm font-semibold text-black/80 mb-3">{date}</div>

          {/* 날짜별 카드 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {arr.map((c) => {
              const hasLocation = typeof c.lat === 'number' && typeof c.lng === 'number'
              const timeText = new Date(c.timestamp as number).toLocaleTimeString()
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCurrent({
                      ...c,
                      timestamp: typeof c.timestamp === 'string' ? normalizeTs(c.timestamp) : c.timestamp
                    })
                    setOpen(true)
                  }}
                  className="text-left rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-3"
                >
                  {/* 프리뷰: 배경 흰색, 도형 내부만 사용자 색 */}
                  <div className="relative h-28 rounded-xl bg-white grid place-items-center">
                    <ShapePreview
                      shape={(c.shape as any) ?? 'square'}
                      color={c.color ?? '#cccccc'}
                      size={88}
                    />
                    <div className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-black/30 text-white">
                      {timeText}
                    </div>
                    <div className="absolute top-2 right-2 text-black/70 text-base">
                      {hasLocation ? '📍' : ''}
                    </div>
                  </div>

                  {/* 라벨, 점수 등 간단 정보. 좋아요는 표시하지 않음 */}
                  <div className="mt-2">
                    <div className="text-sm font-medium truncate">
                      {c.label ?? 'unknown'}
                      {typeof c.score === 'number' ? (
                        <span className="text-black/60"> · {Math.round(c.score * 100)}%</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-black/60 mt-0.5">
                      {c.shape} · {c.sound}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {/* 상세 모달 */}
      <DetailModal open={open} item={current} onClose={() => setOpen(false)} />
    </div>
  )
}
