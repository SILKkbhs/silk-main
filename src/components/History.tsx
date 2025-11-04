'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { ref, query, orderByChild, equalTo, limitToLast, onValue, update } from 'firebase/database'
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
    body: JSON.stringify({ color_hex: input.color, shape: input.shape, sound: input.sound }),
  })
  const data = await res.json().catch(() => { throw new Error('AI 응답 파싱 실패') })
  if (!res.ok || data?.error) throw new Error(data?.error || `AI HTTP ${res.status}`)
  const label = data.label || data.prediction
  const score = typeof data.score === 'number' ? data.score : data.confidence
  if (!label || typeof score !== 'number') throw new Error('AI 응답 형식 불일치')
  return { label, score }
}

export default function History() {
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
    if (!uid) return
    const q = query(ref(rtdb, 'emotions'), orderByChild('userId'), equalTo(uid), limitToLast(100))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => { list.push(c.val() as Emotion) })
      const safe = list
        .filter(v => typeof v?.timestamp === 'number')
        .map(v => ({
          id: v.id,
          userId: v.userId ?? 'anonymous',
          color: v.color ?? '#eee',
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
    }, e => { setErr(e?.message || '히스토리를 불러오지 못했습니다.'); setLoading(false) })
    return () => off()
  }, [uid])

  const grouped = useMemo(() => {
    const by: Record<string, Emotion[]> = {}
    for (const it of items) {
      const d = new Date(it.timestamp!)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      ;(by[key] ||= []).push(it)
    }
    return by
  }, [items])

  const [busyId, setBusyId] = useState<string | null>(null)

  const onAnalyze = async (it: Emotion) => {
    if (busyId) return
    try {
      setBusyId(it.id)
      const ai = await predictEmotion({ color: it.color!, shape: it.shape, sound: it.sound })
      await update(ref(rtdb, `emotions/${it.id}`), { label: ai.label, score: ai.score })
    } catch (e: any) {
      alert(e?.message || 'AI 분석 실패')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="grid place-items-center h-[60vh] text-gray-500">불러오는 중…</div>
  if (err) return <div className="grid place-items-center h-[60vh] text-red-500">{err}</div>

  const days = Object.keys(grouped).sort((a,b) => b.localeCompare(a))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">
        <span className="bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] bg-clip-text text-transparent">SILK</span>{' '}
        감정 히스토리
      </h2>

      {days.length === 0 && (
        <p className="text-sm text-gray-500">아직 기록이 없어요. 새 실크를 만들어 보세요.</p>
      )}

      <div className="flex flex-col gap-6">
        {days.map(day => (
          <section key={day}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{day}</h3>
            <div className="flex flex-col gap-3">
              {grouped[day].map(it => {
                const shape = normalizeShape(it.shape)
                const color = it.color ?? '#8877E6'
                const scoreText = typeof it.score === 'number' ? `(${Math.round(it.score * 100)}%)` : ''
                return (
                  <article key={it.id} className="rounded-2xl bg-white border shadow p-3">
                    <div className="flex items-center gap-3">
                      {/* ✅ 미리보기와 동일한 썸네일 */}
                      <ShapePreview shape={shape} color={color} size={48} />

                      <div className="flex-1">
                        <div className="text-sm text-gray-800">
                          {it.label
                            ? <>AI: <b>{it.label}</b> {scoreText}</>
                            : <span className="text-gray-500">AI 결과 없음</span>}
                        </div>
                        <div className="text-xs text-gray-500">{shape} · {it.sound}</div>
                      </div>

                      <button
                        onClick={() => onAnalyze(it)}
                        disabled={busyId === it.id}
                        className="px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] disabled:opacity-60"
                      >
                        {busyId === it.id ? '분석 중…' : '⚡ 분석'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
