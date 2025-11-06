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
  lat?: number
  lng?: number
}

// timestamp 정규화: number(ms)로 통일
function normalizeTs(t: unknown): number {
  if (typeof t === 'number') return t
  if (typeof t === 'string') {
    if (/^\d+$/.test(t)) {
      const n = Number(t)
      // 초 단위로 저장된 경우 보정
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        location.hash = '#login' // 해시 고정
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
          return false
        })

        const safe = list
          .map((v) => {
            const ts = normalizeTs((v as any)?.timestamp)
            return {
              ...v,
              id: v.id,
              userId: v.userId ?? 'anonymous',
              color: v.color ?? '#eeeeee',
              shape: v.shape ?? 'square',
              sound: v.sound ?? '-',
              label: v.label,
              score: v.score,
              timestamp: ts,
              likes: v.likes ?? 0,
              lat: v.lat,
              lng: v.lng,
            }
          })
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
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }, [items])

  if (loading) return <div className="p-4 text-sm text-black/60">불러오는 중…</div>
  if (err) return <div className="p-4 text-sm text-red-600">에러: {err}</div>

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">내 히스토리</h2>

      {grouped.length === 0 && (
        <div className="text-sm text-black/60">기록이 없습니다.</div>
      )}

      {grouped.map(([date, arr]) => (
        <div key={date} className="mb-6">
          <div className="text-sm font-semibold text-black/70 mb-2">{date}</div>
          <div className="grid grid-cols-1 gap-2">
            {arr.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded"
                    style={{ background: c.color }}
                    aria-label={c.shape}
                    title={c.shape}
                  />
                  <div className="text-sm">
                    <div className="font-medium">
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
                </div>
                <div className="text-xs text-black/60">❤️ {c.likes ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
