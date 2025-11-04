'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { ref, query, orderByChild, equalTo, limitToLast, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'
import ShapePreview from '@/components/ui/ShapePreview'
import { normalizeShape } from '@/utils/shape'

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

export default function HistoryTimeline() {
  const [uid, setUid] = useState<string | null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  // 인증 감시
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  // 내 기록 조회
  useEffect(() => {
    if (!uid) return
    const q = query(ref(rtdb, 'emotions'), orderByChild('userId'), equalTo(uid), limitToLast(100))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => list.push(c.val() as Emotion))
      const safe = list
        .filter(v => typeof v?.timestamp === 'number')
        .map(v => ({
          id: v.id,
          userId: v.userId ?? 'anonymous',
          color: v.color ?? '#8877E6',
          shape: v.shape ?? 'square',
          sound: v.sound ?? '-',
          label: v.label,
          score: v.score,
          timestamp: v.timestamp!,
          likes: v.likes ?? 0,
          lat: v.lat, lng: v.lng,
        }))
        .sort((a,b) => b.timestamp - a.timestamp)
      setItems(safe)
      setLoading(false)
    }, e => { setErr(e?.message || '타임라인을 불러오지 못했습니다.'); setLoading(false) })
    return () => off()
  }, [uid])

  // 날짜별 그룹
  const grouped = useMemo(() => {
    const by: Record<string, Emotion[]> = {}
    for (const it of items) {
      const d = new Date(it.timestamp!)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      ;(by[key] ||= []).push(it)
    }
    return by
  }, [items])

  if (loading) return <div className="text-gray-500">불러오는 중…</div>
  if (err) return <div className="text-red-500">{err}</div>

  const days = Object.keys(grouped).sort((a,b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-6">
      {days.length === 0 && (
        <p className="text-sm text-gray-500">아직 기록이 없어요. 새 실크를 만들어 보세요.</p>
      )}

      {days.map(day => (
        <section key={day} className="rounded-2xl bg-white/60 p-3">
          <header className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-800">{day}</h3>
            <span className="text-xs text-gray-500">{grouped[day].length}개 기록</span>
          </header>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {grouped[day].map(it => {
              const shape = normalizeShape(it.shape)
              const color = it.color ?? '#8877E6'
              const scoreText = typeof it.score === 'number' ? `(${Math.round(it.score * 100)}%)` : ''
              return (
                <div key={it.id} className="shrink-0">
                  {/* ✅ 미리보기와 동일하게 렌더 */}
                  <ShapePreview shape={shape} color={color} size={64} />
                  <div className="mt-1 text-[11px] text-gray-600 text-center whitespace-nowrap">
                    대표 감정: <b>{it.label ?? '분석 없음'}</b>
                    {it.label ? ` ${scoreText}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
