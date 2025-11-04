'use client'
import React, { useEffect, useState, useRef } from 'react'
import { auth, rtdb } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, push, set } from 'firebase/database'
import { stopAllAudios } from '@/utils/audio'   // ✅ 추가



const SHAPES = ['square', 'circle', 'wave', 'triangle'] as const
const SOUNDS = ['chime', 'rain', 'piano', 'drum'] as const
type Shape = typeof SHAPES[number]
type Sound = typeof SOUNDS[number]

// 🔊 사운드 파일 경로
const SOUND_MAP: Record<Sound, string> = {
  chime: '/sounds/chime.mp3',
  rain: '/sounds/rain.mp3',
  piano: '/sounds/piano.mp3',
  drum: '/sounds/drum.mp3',
}
const getSoundUrl = (key?: string | null) =>
  key && SOUND_MAP[key as Sound] ? SOUND_MAP[key as Sound] : null

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

// 미리보기 shape
function ShapePreview({ shape, color, size = 96 }: { shape: Shape; color: string; size?: number }) {
  return (
    <div
      className="rounded-2xl border shadow-inner grid place-items-center overflow-hidden"
      style={{ width: size, height: size, background: color }}
      title={shape}
      aria-label={`preview ${shape}`}
    >
      {shape === 'square' && <div className="rounded-lg" style={{ width: size * 0.58, height: size * 0.58, background: 'rgba(255,255,255,0.85)' }} />}
      {shape === 'circle' && <div className="rounded-full" style={{ width: size * 0.66, height: size * 0.66, background: 'rgba(255,255,255,0.85)' }} />}
      {shape === 'triangle' && (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.29}px solid transparent`,
            borderRight: `${size * 0.29}px solid transparent`,
            borderBottom: `${size * 0.5}px solid rgba(255,255,255,0.85)`,
            transform: 'translateY(6px)',
          }}
        />
      )}
      {shape === 'wave' && (
        <svg width={size * 0.75} height={size * 0.45} viewBox="0 0 100 60" aria-hidden="true">
          <path
            d="M0 30 Q 15 5 30 30 T 60 30 T 90 30"
            fill="none"
            stroke="white"
            strokeOpacity="0.95"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
}

export default function Write() {
  const [uid, setUid] = useState<string | null>(null)
  const [color, setColor] = useState('#8877E6')
  const [shape, setShape] = useState<Shape>(SHAPES[0])
  const [sound, setSound] = useState<Sound>(SOUNDS[0])
  const [useAI, setUseAI] = useState(true)
  const [loc, setLoc] = useState<{lat?:number; lng?:number}>({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // 🔊 오디오 컨트롤
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
    const url = getSoundUrl(sound)
    if (url) el.src = url
  }, [sound])

  useEffect(() => {
    return () => {
      const el = audioRef.current
      if (el) { el.pause(); el.src = '' }
    }
  }, [])

  // ✅ 여기만 교체됨 (겹침 방지 포함)
  const togglePreview = async () => {
    const el = audioRef.current
    if (!el) return
    try {
      if (playing) {
        el.pause()
        setPlaying(false)
      } else {
        stopAllAudios()   // ✅ 추가: 다른 모든 오디오 정지
        if (!el.src) {
          const url = getSoundUrl(sound)
          if (!url) return alert('이 소리는 재생 파일이 없습니다.')
          el.src = url
        }
        await el.play()
        setPlaying(true)
      }
    } catch {
      alert('브라우저 자동재생이 차단되었어요. 버튼을 한 번 더 누르세요.')
    }
  }

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
      } catch {}

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

      {/* ✅ 큰 미리보기 카드 */}
      <div className="rounded-2xl bg-white border shadow p-4">
        <div className="flex items-center gap-4">
          <ShapePreview shape={shape} color={color} />
          <div className="flex-1 text-sm text-gray-600">
            선택한 도형: <b>{shape}</b> · 소리: <b>{sound}</b>
            {loc.lat && loc.lng ? <span className="ml-2 text-gray-500">({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})</span> : null}
            <div className="text-xs text-gray-500 mt-1">색상: {color}</div>
          </div>

          {/* ▶︎ 미리듣기 버튼 */}
          <button
            onClick={togglePreview}
            className="px-3 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
            disabled={!getSoundUrl(sound)}
            aria-label="소리 미리듣기"
          >
            {playing ? '⏸ 일시정지' : '▶︎ 미리듣기'}
          </button>

          {/* 숨김 오디오 */}
          <audio ref={audioRef} preload="none" onEnded={() => setPlaying(false)} />

          <button onClick={grabLocation} className="px-3 py-2 rounded-lg text-white bg-gray-900 hover:bg-black">위치 추가</button>
        </div>
      </div>

      {/* 선택 영역 */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* 색상 */}
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">색상</div>
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-full h-10 border rounded-md" />
          <div className="mt-2 text-xs text-gray-500">{color}</div>
        </div>

        {/* 도형 */}
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">도형</div>
          <div className="grid grid-cols-4 gap-2">
            {SHAPES.map(s => (
              <button
                key={s}
                onClick={()=>setShape(s)}
                aria-pressed={shape===s}
                className={`rounded-lg border p-1 hover:bg-gray-50 ${shape===s ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <ShapePreview shape={s} color={color} size={72} />
              </button>
            ))}
          </div>
        </div>

        {/* 소리 */}
        <div className="rounded-2xl bg-white border shadow p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">소리</div>
          <div className="flex flex-wrap gap-2">
            {SOUNDS.map(s => (
              <button
                key={s}
                onClick={()=>setSound(s)}
                className={`px-3 py-1.5 rounded-full border ${sound===s ? 'text-white bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] border-transparent' : 'bg-white text-gray-700 border-gray-200'}`}
              >
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
        <button
          onClick={onSave}
          disabled={busy || !uid}
          className="px-5 py-2.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] disabled:opacity-60"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>

      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  )
}
