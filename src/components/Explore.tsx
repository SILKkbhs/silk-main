'use client'
import React, { useEffect, useRef, useState } from 'react'
import { ref as dbRef, onValue, update } from 'firebase/database'
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
    const bright = parseInt((input.color || '#888888').replace('#', ''), 16) > 0x888888
    return { label: bright ? '긍정' : '차분', score: 0.6 }
  }
  const res = await fetch(`${AI_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color_hex: input.color, shape: input.shape, sound: input.sound }),
  })
  const data = await res.json().catch(() => { throw new Error('AI 응답 파싱 실패') })
  if (!res.ok || data?.error) throw new Error(data?.error || `AI HTTP ${res.status}`)
  const label = data.label || data.prediction
  const score = typeof data.score === 'number' ? data.score : data.confidence
  if (!label || typeof score !== 'number') throw new Error('AI 응답 형식 불일치')
  return { label, score }
}

// ---------------- Google Maps safe loader ----------------
let mapsLoader: Promise<typeof google> | null = null
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    return Promise.resolve((window as any).google)
  }
  if (!mapsLoader) {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key) return Promise.reject(new Error('GOOGLE_MAPS_API_KEY 누락'))
    mapsLoader = new Promise((resolve, reject) => {
      const existing = document.getElementById('google-maps-sdk') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve((window as any).google))
        existing.addEventListener('error', () => reject(new Error('Google Maps 로드 실패')))
        return
      }
      const script = document.createElement('script')
      script.id = 'google-maps-sdk'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
      script.async = true
      script.defer = true
      script.onload = () => resolve((window as any).google)
      script.onerror = () => reject(new Error('Google Maps 로드 실패'))
      document.body.appendChild(script)
    })
  }
  return mapsLoader
}
// ---------------------------------------------------------

export default function Explore() {
  const [cards, setCards] = useState<Emotion[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string>('')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  // 데이터 구독
  useEffect(() => {
    const unsub = onValue(dbRef(rtdb, 'emotions'), snap => {
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

  // 맵 초기화
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then(g => {
        if (cancelled || !mapRef.current || mapInstance.current) return
        mapInstance.current = new g.maps.Map(mapRef.current, {
          center: { lat: 37.5665, lng: 126.978 }, // 서울
          zoom: 11,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        })
      })
      .catch(err => setMapError(err.message || '지도 로드 실패'))
    return () => { cancelled = true }
  }, [])

  // 마커 업데이트
  useEffect(() => {
    const g = (window as any).google as typeof google | undefined
    if (!mapInstance.current || !g) return

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    withGeo.forEach(c => {
      const marker = new g.maps.Marker({
        position: { lat: c.lat!, lng: c.lng! },
        map: mapInstance.current!,
        title: c.label || '감정 카드',
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: c.color || '#4285F4',
          fillOpacity: 1,
          strokeColor: '#333',
          strokeWeight: 1,
        },
      })

      const info = new g.maps.InfoWindow({
        content: `
          <div style="min-width:160px">
            <div><b>${c.label || '분석 안됨'}</b></div>
            <div style="font-size:12px;color:#555">${c.lat?.toFixed(3)}, ${c.lng?.toFixed(3)}</div>
            <div style="margin-top:4px;font-size:12px;">score: ${c.score ? Math.round(c.score * 100) + '%' : '-'}</div>
          </div>
        `,
      })
      marker.addListener('click', () => info.open({ map: mapInstance.current!, anchor: marker }))
      markersRef.current.push(marker)
    })

    return () => {
      // 효과 정리: 다음 렌더에서 기존 마커 정리
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
    }
  }, [withGeo])

  const onAnalyze = async (c: Emotion) => {
    if (busyId) return
    try {
      setBusyId(c.id)
      const ai = await predictEmotion({ color: c.color!, shape: c.shape, sound: c.sound })
      await update(dbRef(rtdb, `emotions/${c.id}`), { label: ai.label, score: ai.score })
    } catch (e: any) {
      alert(e?.message || 'AI 분석 실패')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-3 p-4 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold">탐색 (지도/트렌드)</h2>
      <p className="text-sm text-gray-500">Google Maps 위에 감정 카드 표시</p>

      {/* 지도 영역 */}
      <div ref={mapRef} className="w-full h-[500px] rounded-lg border" />
      {mapError && <p className="text-sm text-red-500">{mapError}</p>}

      {/* 리스트 (지도 없을 때 대비) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(withGeo.length ? withGeo : cards).map(c => (
          <div key={c.id} className="rounded-2xl border bg-white shadow-sm p-3">
            <div className="h-28 rounded-xl" style={{ background: c.color }} />
            <div className="mt-2 flex items-center justify-between">
              <small className="text-gray-500">
                {(c.lat?.toFixed?.(3) ?? '-')}, {(c.lng?.toFixed?.(3) ?? '-')}
              </small>
              <button
                onClick={() => onAnalyze(c)}
                disabled={busyId === c.id}
                className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {busyId === c.id ? '분석중…' : '⚡분석'}
              </button>
            </div>
            {c.label && (
              <div className="mt-1 text-xs text-gray-600">
                AI: {c.label} ({typeof c.score === 'number' ? Math.round(c.score * 100) : 0}%)
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
