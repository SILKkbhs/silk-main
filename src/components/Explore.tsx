'use client'
import React, { useEffect, useState } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase'

type Emotion = {
  id: string
  userId?: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  lat?: number
  lng?: number
  timestamp?: number
  likes?: number
}

const RAW = (import.meta as any).env?.VITE_AI_BASE ?? ''
const AI_BASE = String(RAW || '').replace(/\/+$/, '')

async function predictEmotion(input: { color: string; shape?: string; sound?: string }) {
  if (!AI_BASE) {
    const bright = parseInt((input.color || '#888888').replace('#',''),16) > 0x888888
    return { label: bright ? '긍정' : '차분', score: 0.6 }
  }
  const res = await fetch(`${AI_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('AI 서버 오류')
  return res.json() as Promise<{ label: string; score: number }>
}

export default function Explore() {
  const [cards, setCards] = useState<Emotion[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onValue(ref(rtdb, 'emotions'), snap => {
      const v = snap.val() || {}
      const list = Object.values(v) as Emotion[]
      const safe = list
        .filter(x => typeof x?.timestamp === 'number')
        .map(x => ({
          ...x,
          userId: x.userId ?? 'anonymous',
          color: x.color ?? '#eee',
          shape: x.shape ?? '-',
          sound: x.sound ?? '-',
          likes: x.likes ?? 0,
        }))
      setCards(safe)
    })
    return () => unsub()
  }, [])

  const withGeo = cards.filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')

  const onAnalyze = async (c: Emotion) => {
    if (busyId) return
    try {
      setBusyId(c.id)
      const ai = await predictEmotion({ color: c.color!, shape: c.shape, sound: c.sound })
      await update(ref(rtdb, `emotions/${c.id}`), { label: ai.label, score: ai.score })
    } catch (e:any) {
      alert(e?.message || 'AI 분석 실패')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3 p-4 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold">탐색 (지도/트렌드)</h2>
      <p className="text-sm text-gray-500">데모에서는 지도 대신 목록형으로 먼저 확인</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(withGeo.length?withGeo:cards).map(c => (
          <div key={c.id} className="rounded-2xl border bg-white shadow-sm p-3">
            <div className="h-28 rounded-xl" style={{ background: c.color }} />
            <div className="mt-2 flex items-center justify-between">
              <small className="text-gray-500">
                {(c.lat?.toFixed?.(3)??'-')}, {(c.lng?.toFixed?.(3)??'-')}
              </small>
              <button
                onClick={() => onAnalyze(c)}
                disabled={busyId===c.id}
                className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {busyId===c.id ? '분석중…' : '⚡분석'}
              </button>
            </div>
            {c.label && (
              <div className="mt-1 text-xs text-gray-600">
                AI: {c.label} ({typeof c.score==='number'?Math.round(c.score*100):0}%)
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
