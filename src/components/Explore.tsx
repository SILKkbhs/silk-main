// src/components/Explore.tsx
'use client'
import React, { useEffect, useRef, useState, useMemo } from 'react'
// 💡 remove 함수를 추가로 import 합니다.
import { ref as dbRef, onValue, update, remove } from 'firebase/database' 
import { rtdb } from '@/lib/firebase'

// 💡 Emotion Type 정의
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

// ---------------- AI Analysis Functions ----------------
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

// 감정 레이블의 색상 매핑
const getColorForLabel = (label: string) => {
    switch (label) {
        case 'sad': return 'text-purple-500';
        case 'calm': return 'text-green-700';
        case 'love': return 'text-pink-500';
        case '긍정': return 'text-green-500';
        case '차분': return 'text-blue-500';
        case '활기': return 'text-yellow-500';
        case '우울': return 'text-red-500';
        case '불안': return 'text-pink-500';
        default: return 'text-gray-500';
    }
}
// ---------------------------------------------------------

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

// 마커와 InfoWindow를 연결하기 위한 Custom Type
type MarkerWithInfo = google.maps.Marker & {
    __infoWindow: google.maps.InfoWindow;
    __emotionId: string;
}

export default function Explore() {
  const [cards, setCards] = useState<Emotion[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string>('')

  const [targetLocation, setTargetLocation] = useState<{ lat: number, lng: number, id: string } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersMapRef = useRef<Map<string, MarkerWithInfo>>(new Map()) 

  // 데이터 구독 (기존과 동일)
  useEffect(() => {
    const unsub = onValue(dbRef(rtdb, 'emotions'), snap => {
      const v = snap.val() || {}
      const list: Emotion[] = Object.keys(v).map(key => ({ id: key, ...v[key] }))
       
      const safe = list
        .filter(x => typeof x?.timestamp === 'number')
        .map(x => ({
          ...x,
          id: x.id,
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

  // 🌟 useMemo를 사용하여 날짜별로 카드 그룹화 및 정렬
  const { groupedCards, sortedDates } = useMemo(() => {
        const grouped = cards.reduce((acc, card) => {
            if (card.timestamp) {
                // 날짜를 'YYYY. MM. DD.' 형식으로 그룹화 키 생성
                const dateKey = new Date(card.timestamp).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\.\s/g, '. ').trim(); // '2025. 10. 26.'

                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(card);
            }
            return acc;
        }, {} as Record<string, Emotion[]>);

        // 날짜를 최신순으로 정렬
        const dates = Object.keys(grouped).sort((a, b) => {
            // "YYYY. MM. DD." 형태를 Date 객체로 변환하기 위해 "-"로 치환
            const dateA = new Date(a.replace(/\. /g, '-').replace(/\.$/, ''));
            const dateB = new Date(b.replace(/\. /g, '-').replace(/\.$/, ''));
            return dateB.getTime() - dateA.getTime();
        });

        return { groupedCards: grouped, sortedDates: dates };
  }, [cards]);


  // 맵 초기화 (기존과 동일)
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

  // 마커 업데이트 (기존과 동일)
  useEffect(() => {
    const g = (window as any).google as typeof google | undefined
    if (!mapInstance.current || !g) return

    // 위치 정보가 있는 카드만 필터링하여 지도에 사용
    const withGeo = cards.filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')

    const map = mapInstance.current;
    const markersMap = markersMapRef.current;
    const newMarkersMap = new Map<string, MarkerWithInfo>();
    let bounds = new g.maps.LatLngBounds();

    // 기존 마커 재활용 및 삭제
    markersMap.forEach((marker, id) => {
        if (!withGeo.some(c => c.id === id)) {
            marker.setMap(null); // 지도에서 제거
        }
    });

    withGeo.forEach(c => {
        // ... (마커 생성/업데이트 및 InfoWindow 로직 생략)
        const infoContent = `
          <div style="min-width:160px">
            <div><b>${c.label || '분석 안됨'}</b></div>
            <div style="font-size:12px;color:#555">${c.lat?.toFixed(3)}, ${c.lng?.toFixed(3)}</div>
            <div style="margin-top:4px;font-size:12px;">score: ${c.score ? Math.round(c.score * 100) + '%' : '-'}</div>
          </div>
        `;

        if (markersMap.has(c.id)) {
            const marker = markersMap.get(c.id)!;
            marker.__infoWindow.setContent(infoContent);
            newMarkersMap.set(c.id, marker);
        } else {
            // 새 마커 생성
            const info = new g.maps.InfoWindow({ content: infoContent })
            const marker = new g.maps.Marker({
                position: { lat: c.lat!, lng: c.lng! },
                map: map,
                title: c.label || '감정 카드',
                icon: {
                    path: g.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: c.color || '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#333',
                    strokeWeight: 1,
                },
            }) as MarkerWithInfo;
            
            marker.__infoWindow = info;
            marker.__emotionId = c.id;

            marker.addListener('click', () => {
                markersMapRef.current.forEach(m => m.__infoWindow.close()); // 다른 InfoWindow 닫기
                info.open({ map: map, anchor: marker });
            });
            newMarkersMap.set(c.id, marker);
        }
        bounds.extend({ lat: c.lat!, lng: c.lng! });
    })

    // 최종 마커 맵 업데이트 및 범위 설정
    markersMapRef.current = newMarkersMap;
    if (!bounds.isEmpty()) {
        mapInstance.current.fitBounds(bounds);
    }
  
  }, [cards]) // 의존성 배열을 'cards'로 유지


  // 지도 이동 및 InfoWindow 열기 로직 (기존과 동일)
  useEffect(() => {
    if (targetLocation && mapInstance.current) {
        const marker = markersMapRef.current.get(targetLocation.id);
        const position = { lat: targetLocation.lat, lng: targetLocation.lng };

        // 지도 중앙 이동 및 확대
        mapInstance.current.panTo(position);
        mapInstance.current.setZoom(14); 
        
        // 기존 열린 InfoWindow 닫고 타겟 마커의 InfoWindow 열기
        markersMapRef.current.forEach(m => m.__infoWindow.close());
        if (marker) {
            marker.__infoWindow.open({ anchor: marker, map: mapInstance.current });
        }
    }
  }, [targetLocation, mapInstance.current]);

  // 카드 클릭 핸들러 (기존과 동일)
  const handleMapCenter = (c: Emotion) => {
    if (typeof c.lat !== 'number' || typeof c.lng !== 'number') {
        alert('이 기록에는 위치 정보가 없어 지도로 확인할 수 없습니다.');
        return;
    }
    
    if (!mapInstance.current) {
        alert('지도가 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
        return;
    }
    
    setTargetLocation({ lat: c.lat, lng: c.lng, id: c.id });
  }

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

    // 🌟 삭제 버튼 핸들러 추가
    const onDelete = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation(); // 카드 클릭 이벤트 전파 방지
        if (window.confirm('정말로 이 감정 기록을 삭제하시겠습니까?')) {
            try {
                // Firebase Realtime Database에서 해당 ID의 레코드 삭제
                await remove(dbRef(rtdb, `emotions/${id}`));
                alert('감정 기록이 삭제되었습니다.');
            } catch (error) {
                alert('삭제 중 오류가 발생했습니다: ' + (error as Error).message);
            }
        }
    };

  return (
    <section className="space-y-3 p-4 pt-20 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold">탐색 (지도/트렌드)</h2>
      <p className="text-sm text-gray-500">Google Maps 위에 감정 카드 표시</p>

      {/* 지도 영역 */}
      <div ref={mapRef} className="w-full h-[500px] rounded-lg border" />
      {mapError && <p className="text-sm text-red-500">{mapError}</p>}

      {/* 🌟 날짜별 그룹화된 카드 리스트 */}
      <div className="space-y-8">
        {sortedDates.map(date => (
            <div key={date} className="space-y-4">
                <h3 className="text-xl font-bold border-b pb-2 text-gray-700">
                    {/* 날짜 표시 포맷 변경: 2025. 10. 26. (일) */}
                    {new Date(date.replace(/\. /g, '-').replace(/\.$/, '')).toLocaleDateString('ko-KR', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric',
                         weekday: 'short' 
                    })}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {groupedCards[date].map(c => {
                        const hasLabel = !!c.label;
                        const hasLocation = typeof c.lat === 'number' && typeof c.lng === 'number';
                        // 날짜 텍스트는 간결하게 유지 (예: 10. 26.)
                        const dateText = c.timestamp ? new Date(c.timestamp).toLocaleDateString('ko-KR').substring(5, 12).replace(/\s/g, '') : '-'; 

                        return (
                            <div 
                                key={c.id} 
                                onClick={() => c.lat && c.lng ? handleMapCenter(c) : alert('위치 정보가 없는 카드입니다.')}
                                className={`rounded-2xl border bg-white shadow-sm p-3 ${hasLocation ? 'cursor-pointer hover:shadow-md transition-shadow' : 'cursor-default opacity-80'}`}
                            >
                                {/* 감정 시각화 영역 (날짜 및 위치 아이콘 포함) */}
                                <div 
                                    className="relative h-28 rounded-xl flex items-center justify-center" 
                                    style={{ background: c.color }}
                                >
                                    {/* 1. 날짜 레이블 */}
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-black bg-opacity-30 rounded-full text-xs text-white font-medium z-10">
                                        {dateText}
                                    </div>

                                    {/* 2. 위치 정보 아이콘 */}
                                    <div className="absolute top-3 right-3 text-white text-lg z-10">
                                        {hasLocation ? '📍' : ' '}
                                    </div>
                                </div>
                                
                                {/* 정보 영역 (Feed 스타일) */}
                                <div className="p-1 flex flex-col justify-center bg-white">
                                    {/* 도형/소리 */}
                                    <div className="text-xs text-gray-500 font-medium truncate mt-2 mb-1">
                                        {c.shape} · {c.sound}
                                    </div>
                                    
                                    {/* 감정 라벨 */}
                                    <div className="text-lg font-extrabold truncate">
                                        {hasLabel ? (
                                            <span className={`${getColorForLabel(c.label!)}`}>
                                                {c.label}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">분석 필요</span>
                                        )}
                                    </div>
                                    
                                    {/* AI 점수 */}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {hasLabel && `AI ${(Math.round((c.score ?? 0) * 100))}%`}
                                    </div>
                                </div>

                                {/* 액션 버튼 영역 */}
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {/* 🌟 삭제 버튼 */}
                                        <button
                                            onClick={(e) => onDelete(c.id, e)}
                                            className="p-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                        <small className="text-gray-500 text-xs">
                                            {(c.lat?.toFixed?.(3) ?? '-')}, {(c.lng?.toFixed?.(3) ?? '-')}
                                        </small>
                                    </div>
                                    
                                    {/* 지도 이동 버튼, 위치 없음 표시, 또는 AI 분석 버튼 */}
                                    {hasLocation ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMapCenter(c); }}
                                            className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                                        >
                                            🗺️ 이동
                                        </button>
                                    ) : (
                                        !hasLabel ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAnalyze(c); }}
                                                disabled={busyId === c.id}
                                                className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                {busyId === c.id ? '분석중…' : '⚡분석'}
                                            </button>
                                        ) : (
                                            <div className="px-2 py-1 text-xs font-semibold rounded-md text-gray-400 border border-gray-300">
                                                위치 없음
                                            </div>
                                        )
                                    )}

                                    {hasLocation && !hasLabel && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAnalyze(c); }}
                                            disabled={busyId === c.id}
                                            className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {busyId === c.id ? '분석중…' : '⚡분석'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        ))}
        {sortedDates.length === 0 && (
            <p className="text-center text-gray-500 mt-10">기록된 감정 카드가 없습니다.</p>
        )}
      </div>
    </section>
  )
}