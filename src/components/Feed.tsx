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

// AI 분석 함수 (기존 코드 유지)
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

  // 사용자 인증 (기존 코드 유지)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) location.hash = 'login'
      setUid(u ? u.uid : null)
    })
    return () => unsub()
  }, [])

  // 데이터 로드 (최근 50개)
  useEffect(() => {
    // 💡 Firebase key를 id로 사용하도록 수정
    const q = query(ref(rtdb, 'emotions'), orderByChild('timestamp'), limitToLast(50)) 
    const off = onValue(q, snap => {
      const list: Emotion[] = []
      snap.forEach(c => { list.push({ id: c.key ?? 'missing-id', ...(c.val() as Omit<Emotion, 'id'>) }) })
      
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

  if (loading) return <div className="grid place-items-center h-[60vh] text-gray-500 text-lg">⏳ 불러오는 중…</div>
  if (err) return <div className="grid place-items-center h-[60vh] text-red-500 text-lg font-bold">❌ {err}</div>

  // 2x3 (6개) 그리드 뷰를 위해 처음 6개 항목만 사용
  const displayItems = items.slice(0, 6)
  
  // 감정 레이블의 색상 매핑
  const getColorForLabel = (label: string) => {
    switch (label) {
        case '긍정': return 'text-green-500';
        case '차분': return 'text-blue-500';
        case '활기': return 'text-yellow-500';
        case '우울': return 'text-red-500';
        case '불안': return 'text-pink-500';
        default: return 'text-gray-500';
    }
  }

  return (
    
    <div 
        className="max-w-4xl mx-auto px-6 py-8 pt-20" 
    >
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b-4 border-indigo-400 pb-3">
            실크 겔러리
        </h2>

        {displayItems.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 text-md p-8 bg-gray-100 rounded-xl shadow-inner">
                아직 공유된 실크 기록이 부족합니다.
            </p>
        ) : (
            
            <div className="grid grid-cols-3 gap-6">
                {displayItems.map(it => {
                    const hasLabel = !!it.label;
                    return (
                        <div 
                            key={it.id} 
                            // 🌟 깔끔한 카드 디자인
                            className="aspect-square rounded-3xl shadow-xl border border-gray-100 overflow-hidden 
                                       transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                        >
                            {/* 감정 시각화 영역 */}
                            <div 
                                className="relative h-2/3 flex items-center justify-center" 
                                style={{ background: it.color }}
                            >
                                {/* 날짜 레이블 (잘림 방지) */}
                                <div className="absolute top-3 left-3 px-3 py-1 bg-black bg-opacity-30 rounded-full text-xs text-white font-medium z-10">
                                    {new Date(it.timestamp!).toLocaleDateString('ko-KR').substring(5, 12)}
                                </div>
                                
                                
                            </div>

                            {/* 정보 영역 */}
                            <div className="h-1/3 p-3 flex flex-col justify-center bg-white">
                                <div className="text-xs text-gray-500 font-medium truncate mb-1">
                                    {it.shape} · {it.sound}
                                </div>
                                <div className="text-lg font-extrabold truncate">
                                    {hasLabel ? (
                                        <span className={`${getColorForLabel(it.label!)}`}>
                                            {it.label}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">분석 필요</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {hasLabel && `AI ${(Math.round((it.score ?? 0) * 100))}%`}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  )
}