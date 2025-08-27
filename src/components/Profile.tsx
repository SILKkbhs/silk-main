'use client'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ref, query, orderByChild, equalTo, limitToLast, onValue, update
} from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'

type Emotion = {
  id: string
  userId: string
  color: string
  shape: string
  sound: string
  label?: string
  score?: number
  lat?: number
  lng?: number
  timestamp: number
  likes?: number
}

const RAW = (import.meta as any).env?.VITE_AI_BASE ?? ''
const AI_BASE = String(RAW || '').replace(/\/+$/, '')

async function predictEmotion(input: { color: string; shape: string; sound: string }) {
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

export default function Profile() {
  const [uid, setUid] = useState<string | null>(null)
  const [items, setItems] = useState<Emotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    const q = query(ref(rtdb, 'emotions'), orderByChild('userId'), equalTo(uid), limitToLast(40))
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => { list.push(c.val() as Emotion) }) // 반환값 없이 푸시
      list.sort((a,b) => b.timestamp - a.timestamp)
      setItems(list)
      setLoading(false)
    })
    return () => off()
  }, [uid])

  const latest = items[0]

  const trendDots = useMemo(() => {
    const labs = items.slice(0, 6).map(i => i.label || '미분석').reverse()
    const colorOf = (lab: string) => {
      switch (lab) {
        case '긍정': return '#facc15'
        case '차분': return '#60a5fa'
        case '활기': return '#34d399'
        case '우울': return '#f43f5e'
        case '불안': return '#fb7185'
        default: return '#9ca3af'
      }
    }
    return labs.map((lab, i) => ({ lab, color: colorOf(lab), key: i }))
  }, [items])

  const mostUsed = useMemo(() => {
    const pickMode = (arr: string[]) => {
      const m = new Map<string, number>()
      for (const a of arr) m.set(a, (m.get(a) || 0) + 1)
      let best = ''; let cnt = 0
      m.forEach((v, k) => { if (v > cnt) { best = k; cnt = v } })
      return best
    }
    return {
      shape: pickMode(items.map(i=>i.shape)),
      color: pickMode(items.map(i=>i.color)),
      sound: pickMode(items.map(i=>i.sound)),
    }
  }, [items])

  const onAnalyze = async () => {
    if (!latest) return
    try {
      const ai = await predictEmotion({ color: latest.color, shape: latest.shape, sound: latest.sound })
      await update(ref(rtdb, `emotions/${latest.id}`), { label: ai.label, score: ai.score })
    } catch (e: any) {
      alert(e?.message || 'AI 분석 실패')
    }
  }

  if (loading) return <div className="grid place-items-center h-[60vh] text-gray-500">불러오는 중…</div>

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="text-2xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] bg-clip-text text-transparent">SILK</span>{' '}
          <span className="text-gray-800">개인 감정 케어</span>
        </div>
      </header>

      {/* 현재 실크 + 변경 */}
      <section className="rounded-2xl bg-white border shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border shadow-inner" style={{ background: latest?.color || '#eee' }}
               title={latest ? `${latest.shape} / ${latest.sound}` : 'no data'} />
          <div className="flex-1">
            <div className="text-sm text-gray-500">현재 실크</div>
            <div className="text-base font-medium text-gray-800">
              {latest ? `${latest.shape} · ${latest.sound}` : '아직 실크가 없어요'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latest && (
              <button onClick={onAnalyze}
                className="px-3 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]">
                ⚡ 분석
              </button>
            )}
            <button onClick={()=>location.hash='write'}
              className="px-3 py-2 rounded-xl text-white font-semibold bg-gray-900 hover:bg-black">
              실크 변경하기 +
            </button>
          </div>
        </div>
      </section>

      {/* 히스토리 */}
      <section className="rounded-2xl bg-white border shadow-sm p-4">
        <h3 className="text-[#8877E6] font-semibold mb-3">감정 히스토리</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">아직 기록이 없어요. 실크를 하나 만들어 보세요.</p>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {items.slice(0, 12).map(it => (
              <div key={it.id} className="flex flex-col items-center gap-1 min-w-[64px]">
                <div className="w-12 h-12 rounded-xl border shadow-inner" style={{ background: it.color }}
                     title={`${it.shape}/${it.sound}`} />
                <div className="text-[10px] text-gray-500">
                  {new Date(it.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI 분석 요약 */}
      <section className="rounded-2xl bg-white border shadow-sm p-4">
        <h3 className="text-[#8877E6] font-semibold mb-3">AI 감정 분석</h3>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">나의 감정 흐름</div>
          <div className="flex items-center gap-3">
            {trendDots.map(d => (
              <span key={d.key} className="inline-block w-4 h-4 rounded-full" style={{ background: d.color }} />
            ))}
            {trendDots.length === 0 && <span className="text-sm text-gray-400">분석 데이터 없음</span>}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">내가 자주 사용하는 실크</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">도형</div>
              <div className="font-medium text-gray-800">{mostUsed.shape || '-'}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">색</div>
              <div className="w-8 h-8 rounded-lg mx-auto border shadow-inner"
                   style={{ background: mostUsed.color || '#eee' }} />
              <div className="text-[10px] text-gray-500 mt-1">{mostUsed.color || '-'}</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">소리</div>
              <div className="font-medium text-gray-800">{mostUsed.sound || '-'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 상담 CTA */}
      <section className="rounded-2xl bg-white border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[#8877E6] font-semibold">AI 감정 상담</h3>
            <p className="text-sm text-gray-500 mt-1">간단한 질문으로 마음을 가볍게 정리해 보세요.</p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]"
            onClick={() => alert('대회용 데모: 다음 스프린트에서 연결 예정')}
          >
            시작하기
          </button>
        </div>
      </section>
    </div>
  )
}
