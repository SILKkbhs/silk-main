'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ref as dbRef, onValue, update, remove, runTransaction } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import ShapePreview from '@/components/ui/ShapePreview'
import DetailModal from '@/components/DetailModal'

type Emotion = {
  id: string
  userId?: string
  authorName?: string
  color?: string
  shape?: string
  sound?: string
  label?: string
  score?: number
  scores?: Partial<Record<'happy'|'sad'|'angry'|'calm'|'fear'|'love', number>>
  lat?: number
  lng?: number
  timestamp?: number
  likes?: number
}

const RAW = (import.meta as any).env?.VITE_AI_BASE ?? ''
const AI_BASE = String(RAW || '').replace(/\/+$/,'')

// ---------- robust parser ----------
const toNum = (v:any) => { const n = typeof v==='number'?v:parseFloat(v); return Number.isFinite(n)?n:null }
function pickFromText(text:string): {label:string|null, score:number|null, scores?:Record<string,number>} {
  let j:any=null; try{ j = JSON.parse(text) }catch{}
  if (j && typeof j==='object') {
    const c = toNum(j?.confidence)
    if (typeof j?.prediction==='string' && c!=null) return { label:String(j.prediction).toLowerCase(), score:c, scores:j?.probabilities }
    if (j?.probabilities && typeof j.probabilities==='object') {
      const arr = Object.entries(j.probabilities).map(([k,v])=>[String(k).toLowerCase(), toNum(v) as number]).filter(([,p])=>p!=null) as [string,number][]
      if (arr.length){ arr.sort((a,b)=>b[1]-a[1]); return { label:arr[0][0], score:arr[0][1], scores:j.probabilities } }
    }
    const s2 = toNum(j?.score)
    if (typeof j?.label==='string' && s2!=null) return { label:j.label, score:s2, scores:j?.scores }
    if (j?.scores && typeof j.scores==='object') {
      const arr2 = Object.entries(j.scores).map(([k,v])=>[String(k).toLowerCase(), toNum(v) as number]).filter(([,p])=>p!=null) as [string,number][]
      if (arr2.length){ arr2.sort((a,b)=>b[1]-a[1]); return { label:arr2[0][0], score:arr2[0][1], scores:j.scores } }
    }
  }
  const lab = /"prediction"\s*:\s*"([A-Za-z_-]+)"/.exec(text)?.[1] || /"label"\s*:\s*"([A-Za-z_-]+)"/.exec(text)?.[1]
  const sco = /"confidence"\s*:\s*"?(1(?:\.0+)?|0?\.\d+)"?/.exec(text)?.[1] || /"score"\s*:\s*"?(1(?:\.0+)?|0?\.\d+)"?/.exec(text)?.[1]
  if (lab && sco) return { label: lab.toLowerCase(), score: toNum(sco)! }
  return { label:null, score:null }
}

const getColorForLabel = (label?: string) => {
  switch (label) {
    case 'happy': return 'text-green-600'
    case 'calm': return 'text-blue-600'
    case 'love': return 'text-pink-500'
    case 'sad': return 'text-purple-600'
    case 'angry': return 'text-red-600'
    case 'fear': return 'text-amber-600'
    default: return 'text-gray-500'
  }
}

const like = (id: string) => {
  const ref = dbRef(rtdb, `emotions/${id}/likes`)
  return runTransaction(ref, (cur: number | null) => typeof cur === 'number' ? cur + 1 : 1)
}

// ---------- Google Maps ----------
let mapsLoader: Promise<typeof google> | null = null
function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) return Promise.resolve((window as any).google)
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

type MarkerWithInfo = google.maps.Marker & { __infoWindow: google.maps.InfoWindow; __emotionId: string }

export default function Explore() {
  const [cards,setCards] = useState<Emotion[]>([])
  const [busyId,setBusyId] = useState<string|null>(null)
  const [mapError,setMapError] = useState<string>('')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersMapRef = useRef<Map<string,MarkerWithInfo>>(new Map())
  const circlesRef = useRef<google.maps.Circle[]>([])

  const [open,setOpen] = useState(false)
  const [current,setCurrent] = useState<Emotion|null>(null)

  useEffect(()=>{
    const unsub = onValue(dbRef(rtdb,'emotions'), snap=>{
      const v = snap.val() || {}
      const list: Emotion[] = Object.keys(v).map(key => ({ id:key, ...v[key] }))
      const safe = list.filter(x=>typeof x?.timestamp==='number').map(x=>({
        ...x, userId: x.userId ?? 'anonymous', authorName: (x as any).authorName ?? '익명', color: x.color ?? '#eee', shape: x.shape ?? '-', sound: x.sound ?? '-', likes: x.likes ?? 0,
      }))
      setCards(safe)
    })
    return ()=>unsub()
  },[])

  const { groupedCards, sortedDates } = useMemo(()=>{
    const grouped = cards.reduce((acc,card)=>{
      if(card.timestamp){
        const d = new Date(card.timestamp)
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if(!acc[key]) acc[key] = []
        acc[key].push(card)
      }
      return acc
    },{} as Record<string,Emotion[]>)
    const dates = Object.keys(grouped).sort((a,b)=>(a<b?1:-1))
    return { groupedCards: grouped, sortedDates: dates }
  },[cards])

  useEffect(()=>{
    let cancelled=false
    loadGoogleMaps().then(g=>{
      if(cancelled || !mapRef.current || mapInstance.current) return
      mapInstance.current = new g.maps.Map(mapRef.current,{ center:{lat:37.5665,lng:126.9780}, zoom:11, fullscreenControl:false, streetViewControl:false, mapTypeControl:false })
    }).catch(err=>setMapError(err.message||'지도 로드 실패'))
    return ()=>{ cancelled=true }
  },[])

  useEffect(()=>{
    const g = (window as any).google as typeof google | undefined
    if (!mapInstance.current || !g) return

    const withGeo = cards.filter(c=>typeof c.lat==='number' && typeof c.lng==='number')
    const map = mapInstance.current
    const markersMap = markersMapRef.current
    const nextMarkers = new Map<string,MarkerWithInfo>()
    let bounds = new g.maps.LatLngBounds()

    markersMap.forEach((marker,id)=>{ if(!withGeo.some(c=>c.id===id)) marker.setMap(null) })

    withGeo.forEach(c=>{
      const infoContent = `<div style="min-width:160px"><div><b>${c.label ?? 'unknown'}</b> ${typeof c.score==='number' ? Math.round(c.score*100)+'%' : ''}</div><div style="font-size:12px;color:#555">${c.lat?.toFixed(3)}, ${c.lng?.toFixed(3)}</div></div>`
      if (markersMap.has(c.id)){
        const marker = markersMap.get(c.id)!; marker.__infoWindow.setContent(infoContent); nextMarkers.set(c.id, marker)
      } else {
        const info = new g.maps.InfoWindow({ content: infoContent })
        const marker = new g.maps.Marker({
          position:{lat:c.lat!,lng:c.lng!}, map, title:c.label || 'emotion',
          icon:{ path:g.maps.SymbolPath.CIRCLE, scale:7, fillColor:c.color || '#4285F4', fillOpacity:1, strokeColor:'#333', strokeWeight:1 }
        }) as MarkerWithInfo
        marker.__infoWindow = info; marker.__emotionId = c.id
        marker.addListener('click',()=>{ markersMapRef.current.forEach(m=>m.__infoWindow.close()); info.open({ map, anchor: marker }) })
        nextMarkers.set(c.id, marker)
      }
      bounds.extend({lat:c.lat!,lng:c.lng!})
    })
    markersMapRef.current = nextMarkers
    if(!bounds.isEmpty()) map.fitBounds(bounds)

    circlesRef.current.forEach(c=>c.setMap(null)); circlesRef.current = []
    const happySet = withGeo.filter(c=>{ const p = c.scores?.happy ?? (c.label==='happy' ? c.score : undefined); return typeof p==='number' && p>=0.6 })
    type Cell = { latSum:number; lngSum:number; count:number; scoreSum:number }
    const cells = new Map<string,Cell>()
    const keyOf = (lat:number,lng:number)=>`${lat.toFixed(2)},${lng.toFixed(2)}`
    happySet.forEach(c=>{
      const k = keyOf(c.lat!,c.lng!)
      const cell = cells.get(k) || { latSum:0, lngSum:0, count:0, scoreSum:0 }
      cell.latSum += c.lat!; cell.lngSum += c.lng!; cell.count += 1; cell.scoreSum += (c.scores?.happy ?? c.score ?? 0.6)
      cells.set(k,cell)
    })
    cells.forEach(v=>{
      const center = { lat:v.latSum/v.count, lng:v.lngSum/v.count }
      const avgHappy = v.scoreSum/v.count
      const radius = 100 + 50 * v.count
      const opacity = Math.max(0.15, Math.min(0.5, 0.15 + avgHappy * 0.35))
      const circle = new g.maps.Circle({ map, center, radius, strokeColor:'#4CAF50', strokeOpacity:0.6, strokeWeight:1, fillColor:'#4CAF50', fillOpacity:opacity, clickable:false })
      circlesRef.current.push(circle)
    })
  },[cards])

  const handleMapCenter = (c:Emotion)=>{
    if (typeof c.lat!=='number' || typeof c.lng!=='number') return alert('이 기록에는 위치 정보가 없습니다.')
    if (!mapInstance.current) return alert('지도가 아직 로드되지 않았습니다.')
    mapInstance.current.panTo({lat:c.lat,lng:c.lng}); mapInstance.current.setZoom(14)
  }

  const onAnalyze = async (c:Emotion)=>{
    if (busyId) return
    try{
      setBusyId(c.id)
      if (!AI_BASE) { alert('AI_BASE 없음'); return }

      const url = `${AI_BASE}/predict`  // /predict 고정
      const res = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ color_hex: c.color, shape: c.shape, sound: c.sound })
      })
      const txt = await res.text()
      console.log('[AI explore]', res.status, url, txt)
      if (!res.ok) { alert(`AI 오류: ${res.status}`); return }

      const picked = pickFromText(txt)
      const payload:any = {}
      if (typeof picked.label==='string') payload.label = picked.label
      if (typeof picked.score==='number') payload.score = picked.score
      if (picked?.scores && typeof picked.scores==='object') payload.scores = picked.scores
      if (!Object.keys(payload).length) { alert('AI 결과 파싱 실패'); return }

      await update(dbRef(rtdb,`emotions/${c.id}`), payload)
    } catch(e:any){
      alert(e?.message || 'AI 분석 실패')
    } finally { setBusyId(null) }
  }

  const onDelete = async (id:string, event:React.MouseEvent)=>{
    event.stopPropagation()
    if (!confirm('정말로 이 감정 기록을 삭제할까요?')) return
    try{ await remove(dbRef(rtdb,`emotions/${id}`)); alert('삭제 완료') }
    catch(err:any){ alert('삭제 실패: '+err.message) }
  }

  return (
    <section className="space-y-3 p-4 pt-20 max-w-5xl mx-auto">
      <h2 className="text-lg font-semibold">탐색 (지도/트렌드)</h2>
      <p className="text-sm text-gray-500">행복 밀집 지역은 초록 반투명 원으로 표시됩니다.</p>

      <div ref={mapRef} className="w-full h-[500px] rounded-lg border" />
      {mapError && <p className="text-sm text-red-500">{mapError}</p>}

      <div className="space-y-8 mt-4">
        {sortedDates.map(date=>(
          <div key={date} className="space-y-4">
            <h3 className="text-xl font-bold border-b pb-2 text-gray-700">{date}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupedCards[date].map(c=>{
                const hasLabel = !!c.label
                const hasLocation = typeof c.lat==='number' && typeof c.lng==='number'
                const dateText = c.timestamp ? new Date(c.timestamp).toLocaleDateString('ko-KR').substring(5,12).replace(/\s/g,'') : '-'
                return (
                  <div key={c.id} onClick={()=>{ setCurrent(c); setOpen(true) }} className="rounded-2xl border bg-white shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="relative h-28 rounded-xl bg-white grid place-items-center">
                      <ShapePreview shape={(c.shape as any) ?? 'square'} color={c.color ?? '#cccccc'} size={88}/>
                      <div className="absolute top-3 left-3 px-3 py-1 bg-black/30 rounded-full text-xs text-white font-medium z-10">{dateText}</div>
                      <div className="absolute top-3 right-3 text-black/70 text-lg z-10">{hasLocation ? '📍' : ' '}</div>
                    </div>

                    <div className="p-1 flex flex-col justify-center bg-white">
                      <div className="text-xs text-gray-600 font-medium truncate mt-2 mb-1">작성자 : {c.authorName}</div>
                      <div className="text-lg font-extrabold truncate">
                        {hasLabel ? <span className={getColorForLabel(c.label!)}>{c.label}</span> : <span className="text-gray-400">분석 필요</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{hasLabel && `AI ${Math.round((c.score ?? 0) * 100)}%`}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button onClick={(e)=>onDelete(c.id,e)} className="p-1 text-xs text-red-500 hover:text-red-700">🗑️</button>
                        <small className="text-gray-500 text-xs">{(c.lat?.toFixed?.(3) ?? '-')}, {(c.lng?.toFixed?.(3) ?? '-')}</small>
                      </div>

                      {hasLocation ? (
                        <button onClick={(e)=>{ e.stopPropagation(); handleMapCenter(c) }} className="px-2 py-1 text-xs font-semibold rounded-md bg-indigo-500 text-white hover:bg-indigo-600">🗺️ 이동</button>
                      ) : (
                        !hasLabel ? (
                          <button onClick={(e)=>{ e.stopPropagation(); onAnalyze(c) }} disabled={busyId===c.id} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">
                            {busyId===c.id ? '분석중…' : '⚡분석'}
                          </button>
                        ) : (
                          <div className="px-2 py-1 text-xs font-semibold rounded-md text-gray-400 border border-gray-300">위치 없음</div>
                        )
                      )}

                      {hasLocation && !hasLabel && (
                        <button onClick={(e)=>{ e.stopPropagation(); onAnalyze(c) }} disabled={busyId===c.id} className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50">
                          {busyId===c.id ? '분석중…' : '⚡분석'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedDates.length===0 && (<p className="text-center text-gray-500 mt-10">기록된 감정 카드가 없습니다.</p>)}
      </div>

      <DetailModal open={open} item={current} onClose={()=>setOpen(false)} />
    </section>
  )
}
