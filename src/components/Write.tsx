'use client'
import React, { useEffect, useState } from 'react'
import { auth, rtdb } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, push, set } from 'firebase/database'

const SHAPES = ['square', 'circle', 'wave', 'triangle']
const SOUNDS = ['chime', 'rain', 'piano', 'drum']

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
    body: JSON.stringify({ color_hex: input.color, shape: input.shape, sound: input.sound }),
  })
  const data = await res.json().catch(() => { throw new Error('AI 응답 파싱 실패') })
  if (!res.ok || data?.error) throw new Error(data?.error || `AI HTTP ${res.status}`)
  const label = data.label || data.prediction
  const score = typeof data.score === 'number' ? data.score : data.confidence
  if (!label || typeof score !== 'number') throw new Error('AI 응답 형식 불일치')
  return { label, score }
}

export default function Write() {
  const [uid, setUid] = useState<string | null>(null)
  const [color, setColor] = useState('#8877E6')
  const [shape, setShape] = useState(SHAPES[0])
  const [sound, setSound] = useState(SOUNDS[0])
  const [useAI, setUseAI] = useState(true)
  const [loc, setLoc] = useState<{lat?:number; lng?:number}>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  const grabLocation = () => {
    if (!navigator.geolocation) return alert('이 브라우저는 위치 권한을 지원하지 않습니다.')
    navigator.geolocation.getCurrentPosition(
      pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('위치 권한이 거부되었습니다.'),
      { enableHighAccuracy: true, timeout: 6000 }
    )
  }

  const onSave = async () => {
    if (!uid) return alert('로그인이 필요합니다.')
    setErr(''); setBusy(true)
    try {
      const newRef = push(ref(rtdb, 'emotions'))
      const id = newRef.key as string
      const payload: any = {
        id, userId: uid, color, shape, sound,
        timestamp: Date.now(), likes: 0
      }
      if (loc.lat && loc.lng) { payload.lat = loc.lat; payload.lng = loc.lng }

      try {
        if (useAI) {
          const ai = await predictEmotion({ color, shape, sound })
          payload.label = ai.label
          payload.score = ai.score
        }
      } catch (e) {
        console.warn('AI 실패: 라벨 없이 저장합니다.', e)
      }

      await set(newRef, payload)
      location.hash = 'profile'
    } catch (e: any) {
      setErr(e?.message || '저장 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">
        <span className="bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] bg-clip-text text-transparent">SILK</span>{' '}
        새 실크 작성
      </h2>

      <div className="rounded-2xl bg-white border shadow p-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-2xl border shadow-inner" style={{ background: color }} title={`${shape} / ${sound}`} />
          <div className="flex-1 text-sm text-gray-600">
            선택한 도형: <b>{shape}</b> · 소리: <b>{sound}</b>
            {loc.lat && loc.lng ? <span className="ml-2 text-gray-500">({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})</span> : null}
          </div>
          <button onClick={grabLocation} className="px-3 py-2 rounded-lg text-white bg-gray-900 hover:bg-black">위치 추가</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">색상</div>
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 border rounded-md" />
          <div className="mt-2 text-xs text-gray-500">{color}</div>
        </div>
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">도형</div>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map(s => (
              <button key={s} onClick={()=>setShape(s)}
                className={`px-3 py-1.5 rounded-full border ${shape===s ? 'text-white bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] border-transparent' : 'bg-white text-gray-700 border-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">소리</div>
          <div className="flex flex-wrap gap-2">
            {SOUNDS.map(s => (
              <button key={s} onClick={()=>setSound(s)}
                className={`px-3 py-1.5 rounded-full border ${sound===s ? 'text-white bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] border-transparent' : 'bg-white text-gray-700 border-gray-200'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border shadow p-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={useAI} onChange={e=>setUseAI(e.target.checked)} />
          작성 시 자동으로 AI 분석하기
        </label>
        <button onClick={onSave} disabled={busy || !uid}
          className="px-5 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] disabled:opacity-60">
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  )
}
