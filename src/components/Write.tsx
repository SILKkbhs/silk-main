// src/components/Write.tsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { auth, rtdb } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, push, set } from 'firebase/database'
import { stopAllAudios } from '@/utils/audio'
import ShapePreview from '@/components/ui/ShapePreview' // 도형 내부만 색 채우는 컴포넌트

const SHAPES = ['square', 'circle', 'wave', 'triangle'] as const // 기존 그대로
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

export default function Write() {
  const [userId, setUserId] = useState<string>('')
  const [color, setColor] = useState<string>('#7b7bf5')
  const [shape, setShape] = useState<Shape>('square')
  const [sound, setSound] = useState<Sound>('chime')
  const [loc, setLoc] = useState<{lat?: number; lng?: number}>({})
  const [loading, setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        location.hash = '#login'
      } else {
        setUserId(u.uid)
      }
    })
    return () => unsub()
  }, [])

  // 🔊 사운드 미리듣기 초기화
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio()
    return () => {
      try { audioRef.current?.pause() } catch {}
    }
  }, [])

  const togglePlay = async () => {
    if (!audioRef.current) return
    try {
      if (!audioRef.current.paused) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } else {
        stopAllAudios?.()
        const url = SOUND_MAP[sound]
        if (audioRef.current.src !== url) {
          audioRef.current.src = url
        }
        await audioRef.current.play()
      }
    } catch {
      alert('브라우저 자동재생이 차단되었어요. 버튼을 한 번 더 누르세요.')
    }
  }

  const grabLocation = () => {
    if (!navigator.geolocation) return alert('이 브라우저는 위치 권한을 지원하지 않습니다.')
    navigator.geolocation.getCurrentPosition(
      pos => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('위치 권한을 허용해주세요.')
    )
  }

  // ✅ 저장 시 자동 AI 분석 → 결과(label, score)를 함께 저장
  const save = async () => {
    if (!userId) return alert('로그인 후 이용해주세요.')
    setLoading(true)

    let label: string | null = null
    let score: number | null = null

    try {
      const base = (import.meta as any).env?.VITE_AI_BASE ?? ''
      if (!base) console.warn('VITE_AI_BASE 미설정: AI 예측 없이 저장됩니다.')

      if (base) {
        try {
          const res = await fetch(`${base}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color_hex: color, shape, sound }),
          })
          if (res.ok) {
            const data = await res.json()
            label = data?.label ?? null
            score = typeof data?.score === 'number' ? data.score : null
          } else {
            console.warn('AI 예측 실패:', await res.text())
          }
        } catch (e) {
          console.warn('AI 예측 중 오류:', e)
        }
      }

      const refEmo = ref(rtdb, 'emotions')
      const id = push(refEmo).key as string
      await set(ref(rtdb, `emotions/${id}`), {
        id,
        userId,
        color,
        shape,
        sound,
        timestamp: Date.now(),
        likes: 0,
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
        label,
        score,
      })

      alert('저장 완료')
      // 원하면 저장 후 자동 이동
      // location.hash = '#feed'
    } catch {
      alert('저장 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 🔙 나가기 버튼 */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => { location.hash = '#feed' }}
          className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm text-black/70 hover:bg-gray-100"
        >
          ← 나가기
        </button>
      </div>

      {/* 미리보기: 배경 흰색 고정, 도형 내부만 color로 채움 */}
      <div className="rounded-2xl bg-white shadow grid place-items-center h-56 mb-4">
        <ShapePreview shape={shape} color={color} size={140} />
      </div>

      {/* 색상 선택 */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">색상</div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-16 p-0 border rounded"
          aria-label="color"
        />
      </div>

      {/* 도형 선택: 흰색 도형 버튼 */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">도형</div>
        <div className="flex flex-wrap gap-3">
          {SHAPES.map((s) => (
            <button
              key={s}
              onClick={() => setShape(s)}
              className={`p-2 rounded-xl border grid place-items-center ${
                shape === s ? 'bg-black/10 border-black' : 'bg-white border-gray-300'
              }`}
              aria-label={s}
            >
              <ShapePreview shape={s} color="#ffffff" size={36} />
            </button>
          ))}
        </div>
      </div>

      {/* 소리 선택 */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">소리</div>
        <div className="flex flex-wrap gap-2">
          {SOUNDS.map((s) => (
            <button
              key={s}
              onClick={() => setSound(s)}
              className={`px-3 py-1.5 rounded-full border ${
                sound === s ? 'bg-black text-white' : 'bg-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <button
            onClick={togglePlay}
            className="px-3 py-1.5 rounded-xl bg-gray-800 text-white"
          >
            소리 미리듣기
          </button>
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      {/* 위치 */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">위치</div>
        <button onClick={grabLocation} className="px-3 py-1.5 rounded-xl border">
          위치 가져오기
        </button>
        {loc.lat && loc.lng ? (
          <div className="text-xs text-black/60 mt-2">lat {loc.lat}, lng {loc.lng}</div>
        ) : null}
      </div>

      {/* 저장: 클릭 시 자동 AI 분석 후 함께 저장 */}
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
        >
          저장
        </button>
      </div>

      <p className="mt-3 text-xs text-black/50">
        저장 시 자동으로 AI 분석을 수행하고 결과를 함께 저장합니다.
      </p>
    </div>
  )
}
