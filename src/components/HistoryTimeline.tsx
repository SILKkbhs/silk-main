'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'
import ShapeOverlay from '@/components/visuals/ShapeOverlay'
import DetailModal from '@/components/DetailModal'

type Emotion = {
  id: string; userId?: string; color?: string; shape?: string; sound?: string;
  label?: string; score?: number; lat?: number; lng?: number; timestamp?: number
}

function dayAnalysis(list: Emotion[]) {
  const n = list.length
  const cnt: Record<string, number> = {}
  let scoreSum = 0, scored = 0
  for (const x of list) {
    if (x.label) cnt[x.label] = (cnt[x.label]||0)+1
    if (typeof x.score === 'number') { scoreSum += x.score; scored++ }
  }
  const top = Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]
  const topLabel = top?.[0]; const topPct = top ? Math.round((top[1]/n)*100) : null
  const avgScore = scored ? Math.round((scoreSum/scored)*100) : null
  return { n, topLabel, topPct, avgScore }
}

export default function HistoryTimeline() {
  const [uid, setUid] = useState<string|null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Emotion|null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    const q = query(ref(rtdb, 'emotions'), orderByChild('userId'), equalTo(uid))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
    snap.forEach(c => {
        const val = c.val() as Emotion | null
        const { id: _ignored, ...rest } = val ?? {}
        list.push({ ...rest, id: c.key ?? 'missing-id' })
    })
      setItems(list.filter(v => typeof v?.timestamp==='number').sort((a,b)=>a.timestamp!-b.timestamp!))
    })
    return () => off()
  }, [uid])

  const byDate = useMemo(() => {
    const m: Record<string, Emotion[]> = {}
    for (const it of items) {
      const d = new Date(it.timestamp!)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      ;(m[key] ||= []).push(it)
    }
    return m
  }, [items])

  const days = Object.keys(byDate).sort()

  return (
    <section className="space-y-8">
      {days.length===0 && <p className="text-sm text-gray-500">아직 기록이 없어요.</p>}

      {days.map(day => {
        const list = byDate[day]
        const { n, topLabel, topPct, avgScore } = dayAnalysis(list)
        return (
          <article key={day} className="p-4 rounded-2xl bg-white border shadow-sm">
            <div className="flex items-end justify-between mb-3">
              <div className="text-lg font-bold text-gray-800">{day}</div>
              <div className="text-sm text-gray-500">{n}개 기록</div>
            </div>

            <div className="relative px-2 py-6">
              <div className="absolute left-2 right-2 top-1/2 h-[2px] bg-gray-200" />
              <div className="flex gap-6 relative">
                {list.map((it) => (
                  <button
                    key={it.id}
                    onClick={()=>{ setCurrent(it); setOpen(true) }}
                    className="relative -mt-8 w-14 h-14 rounded-xl shadow border overflow-hidden"
                    style={{ background: it.color }}
                    title={new Date(it.timestamp!).toLocaleDateString('ko-KR')}
                  >
                    <ShapeOverlay shape={it.shape} />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-gray-600">
                      {new Date(it.timestamp!).toLocaleDateString('ko-KR').slice(5)}
                    </span>
                    <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              {topLabel
                ? <>대표 감정: <b>{topLabel}</b>{topPct!==null?` (${topPct}%)`:''} · 평균 신뢰도 {avgScore!==null?`${avgScore}%`:'-'} </>
                : <>AI 분석 결과가 없습니다.</>}
            </div>
          </article>
        )
      })}

      <DetailModal open={open} item={current} onClose={()=>setOpen(false)} />
    </section>
  )
}
