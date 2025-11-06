// src/components/HistoryTimeline.tsx
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

type Emotion = {
  id: string
  userId?: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  timestamp?: number | string
  likes?: number
}

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

export default function HistoryTimeline() {
  const [uid, setUid] = useState<string | null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

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
            timestamp: normalizeTs((v as any)?.timestamp),
          }))
          .filter((v) => (v.timestamp as number) > 0)
          .sort((a, b) => (a.timestamp as number) - (b.timestamp as number)) // 타임라인은 오래된→최신

        setItems(safe)
        setLoading(false)
      },
      (e) => {
        setErr(e?.message || '타임라인을 불러오지 못했습니다.')
        setLoading(false)
      }
    )
    return () => off()
  }, [uid])

  // 간단한 지표: 요일별 개수
  const weekdayStats = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0] // Sun..Sat
    for (const it of items) {
      const d = new Date(it.timestamp as number)
      arr[d.getDay()]++
    }
    return arr
  }, [items])

  if (loading) return <div className="p-4 text-sm text-black/60">불러오는 중…</div>
  if (err) return <div className="p-4 text-sm text-red-600">에러: {err}</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">히스토리 타임라인</h2>

      {/* 타임라인 리스트 */}
      <ol className="relative border-l pl-4">
        {items.map((c) => (
          <li key={c.id} className="mb-4 ml-2">
            <div className="absolute -left-1.5 h-3 w-3 rounded-full border bg-white" />
            <div className="rounded-lg border bg-white px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {c.label ?? 'unknown'}
                  {typeof c.score === 'number' ? (
                    <span className="text-black/60">
                      {' '}
                      · {Math.round(c.score * 100)}%
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-black/60">
                  {new Date(c.timestamp as number).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 text-xs text-black/60">
                색상 {c.color ?? '-'} · 도형 {c.shape ?? '-'} · ❤️ {c.likes ?? 0}
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-black/60">기록이 없습니다.</div>
        )}
      </ol>

      {/* 간단 통계 */}
      <div className="mt-6">
        <div className="text-sm font-semibold mb-2">요일별 작성 수</div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className="rounded-lg border bg-white py-2">
              <div className="font-medium">{d}</div>
              <div className="text-black/70">{weekdayStats[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
