'use client'
import React, { useEffect, useState } from 'react'
import { ref, query, orderByChild, limitToLast, onValue, update } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'

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
    body: JSON.stringify({ color_hex: input.color, shape: input.shape, sound: input.sound }),
  })
  const data = await res.json().catch(() => { throw new Error('AI 응답 파싱 실패') })
  if (!res.ok || data?.error) throw new Error(data?.error || `AI HTTP ${res.status}`)
  const label = data.label || data.prediction
  const score = typeof data.score === 'number' ? data.score : data.confidence
  if (!label || typeof score !== 'number') throw new Error('AI 응답 형식 불일치')
  return { label, score }
}

export default function Feed() {
  const [uid, setUid] = useState<string | null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const q = query(ref(rtdb, 'emotions'), orderByChild('timestamp'), limitToLast(50))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => { list.push(c.val() as Emotion) })
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
      setItems(safe)
      setLoading(false)
    }, e => { setErr(e?.message || '피드를 불러오지 못했습니다.'); setLoading(false) })
    return () => off()
  }, [])

  const onLike = async (it: Emotion) => {
    try {
      await update(ref(rtdb, `emotions/${it.id}`), { likes: (it.likes ?? 0) + 1 })
    } catch (e) {
      console.warn(e)
    }
  }

  const onAnalyze = async (it: Emotion) => {
    try {
      const ai = await predictEmotion({ color: it.color!, shape: it.shape, sound: it.sound })
      await update(ref(rtdb, `emotions/${it.id}`), { label: ai.label, score: ai.score })
    } catch (e: any) {
      alert(e?.message || 'AI 분석 실패')
    }
  }

  if (loading) return <div className="grid place-items-center h-[60vh] text-gray-500">불러오는 중…</div>
  if (err) return <div className="grid place-items-center h-[60vh] text-red-500">{err}</div>

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      {items.map(it => (
        <article key={it.id} className="rounded-2xl bg-white border shadow p-4">
          <header className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              {new Date(it.timestamp!).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              {(it.userId ?? 'anonymous').slice(0, 6)}
            </div>
          </header>

          <div className="aspect-square rounded-2xl border shadow-inner mb-3" style={{ background: it.color }} />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {it.label
                ? <>AI: <b>{it.label}</b> {typeof it.score === 'number' ? `(${Math.round(it.score*100)}%)` : ''}</>
                : 'AI 결과 없음'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLike(it)}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                title="공감"
              >
                ❤ {it.likes ?? 0}
              </button>
              <button
                onClick={() => onAnalyze(it)}
                className="px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]"
                title="AI 분석"
              >
                ⚡ 분석
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">{it.shape} · {it.sound}</div>
        </article>
      ))}
    </div>
  )
}
