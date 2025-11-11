'use client'
import React, { useEffect, useState, useRef } from 'react'
import { auth, rtdb } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, push, set } from 'firebase/database'
import ShapePreview from '@/components/ui/ShapePreview'

const SHAPES = ['square','circle','triangle','diamond','star','heart','droplet'] as const
const SOUNDS = ['chime','rain','piano','drum'] as const
type Shape = typeof SHAPES[number]
type Sound = typeof SOUNDS[number]

const SOUND_MAP: Record<Sound,string> = {
  chime:'/sounds/chime.mp3',
  rain:'/sounds/rain.mp3',
  piano:'/sounds/piano.mp3',
  drum:'/sounds/drum.mp3',
}

// ---------- robust parser ----------
const toNum = (v:any) => { const n = typeof v==='number'?v:parseFloat(v); return Number.isFinite(n)?n:null }
function pickFromText(text:string): {label:string|null, score:number|null, scores?:Record<string,number>} {
  let j:any=null; try{ j = JSON.parse(text) }catch{}
  // v3: {prediction, confidence, probabilities}
  if (j && typeof j==='object') {
    const c = toNum(j?.confidence)
    if (typeof j?.prediction==='string' && c!=null) {
      return { label: String(j.prediction).toLowerCase(), score: c, scores: j?.probabilities }
    }
    if (j?.probabilities && typeof j.probabilities==='object') {
      const arr = Object.entries(j.probabilities).map(([k,v])=>[String(k).toLowerCase(), toNum(v) as number]).filter(([,p])=>p!=null) as [string,number][]
      if (arr.length) { arr.sort((a,b)=>b[1]-a[1]); return { label:arr[0][0], score:arr[0][1], scores:j.probabilities } }
    }
  }
  // v2: {label, score} or {scores:{...}}
  if (j && typeof j==='object') {
    const s2 = toNum(j?.score)
    if (typeof j?.label==='string' && s2!=null) return { label:j.label, score:s2, scores:j?.scores }
    if (j?.scores && typeof j.scores==='object') {
      const arr = Object.entries(j.scores).map(([k,v])=>[String(k).toLowerCase(), toNum(v) as number]).filter(([,p])=>p!=null) as [string,number][]
      if (arr.length) { arr.sort((a,b)=>b[1]-a[1]); return { label:arr[0][0], score:arr[0][1], scores:j.scores } }
    }
  }
  // last-resort regex
  const lab = /"prediction"\s*:\s*"([A-Za-z_-]+)"/.exec(text)?.[1] || /"label"\s*:\s*"([A-Za-z_-]+)"/.exec(text)?.[1]
  const sco = /"confidence"\s*:\s*"?(1(?:\.0+)?|0?\.\d+)"?/.exec(text)?.[1] || /"score"\s*:\s*"?(1(?:\.0+)?|0?\.\d+)"?/.exec(text)?.[1]
  if (lab && sco) return { label: lab.toLowerCase(), score: toNum(sco)! }
  return { label:null, score:null }
}

export default function Write(){
  const [userId,setUserId] = useState('')
  const [color,setColor] = useState('#7b7bf5')
  const [shape,setShape] = useState<Shape>('square')
  const [sound,setSound] = useState<Sound>('chime')
  const [loc,setLoc] = useState<{lat?:number;lng?:number}>({})
  const [loading,setLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement|null>(null)
  const [authorName, setAuthorName] = useState<string>(() => {
    return localStorage.getItem('silk_authorName') || ''
  })


  useEffect(()=>onAuthStateChanged(auth,u=>{
    if(!u) location.hash='#login'
    else setUserId(u.uid)
  }),[])

  useEffect(()=>{
    if(!audioRef.current) audioRef.current = new Audio()
    return ()=>{ try{ audioRef.current?.pause() }catch{} }
  },[])

  const onAuthorChange = (v: string) => {
    setAuthorName(v)
    localStorage.setItem('silk_authorName', v)
  }
  const togglePlay = async ()=>{
    if(!audioRef.current) return
    try{
      if(!audioRef.current.paused){ audioRef.current.pause(); audioRef.current.currentTime=0 }
      else{
        const url = SOUND_MAP[sound]
        if (audioRef.current.src !== url) audioRef.current.src = url
        await audioRef.current.play()
      }
    }catch{ alert('브라우저 자동재생이 차단됨. 한 번 더 누르세요.') }
  }

  const grabLocation = ()=>{
    if(!navigator.geolocation) return alert('이 브라우저는 위치 권한을 지원하지 않습니다.')
    navigator.geolocation.getCurrentPosition(
      p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),
      ()=>alert('위치 권한을 허용해주세요.')
    )
  }

  const save = async ()=>{
    if(!userId) return alert('로그인 후 이용해주세요.')
    setLoading(true)

    let label:string|null=null, score:number|null=null, scoresRaw:any=null
    try{
      const base = (import.meta as any).env?.VITE_AI_BASE ?? ''
      if (base) {
        const url = String(base).replace(/\/+$/,'') + '/predict' // /predict 고정
        try {
          const res = await fetch(url, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ color_hex: color, shape, sound })
          })
          const txt = await res.text()
          console.log('[AI write]', res.status, url, txt)
          if (res.ok) {
            const picked = pickFromText(txt)
            label = picked.label
            score = picked.score
            scoresRaw = picked.scores
          }
        } catch (e) {
          console.warn('AI 예측 실패', e)
        }
      } else {
        console.warn('VITE_AI_BASE 미설정')
      }

      const id = push(ref(rtdb,'emotions')).key as string
      const payload:any = {
        id, userId, color, shape, sound,
        timestamp: Date.now(), likes: 0,
        authorName: (authorName || '익명').trim(),
        ...(loc.lat!=null?{lat:loc.lat}:{ }),
        ...(loc.lng!=null?{lng:loc.lng}:{ }),
        ...(label!=null?{label}:{ }),
        ...(score!=null?{score}:{ }),
        ...(scoresRaw && typeof scoresRaw==='object' ? {scores:scoresRaw} : {}),
      }
      await set(ref(rtdb,`emotions/${id}`), payload)
      alert('저장 완료')
    }catch(e){
      alert('저장 실패')
      console.error(e)
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <label className="block text-sm font-medium">피드에 표시할 닉네임</label>
      <input
        className="w-full mt-2 mb-4 p-3 border rounded-lg"
        placeholder="예) 홍길동"
        value={authorName}
        onChange={(e)=>onAuthorChange(e.target.value)}
        maxLength={20}
      />
      <div className="flex justify-end mb-3">
        <button onClick={()=>{ location.hash='#profile' }} className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm text-black/70 hover:bg-gray-100">← 나가기</button>
      </div>

      <div className="rounded-2xl bg-white shadow grid place-items-center h-56 mb-4">
        <ShapePreview shape={shape} color={color} size={140} />
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">색상</div>
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="h-10 w-16 p-0 border rounded" aria-label="color"/>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">도형</div>
        <div className="flex flex-wrap gap-3">
          {SHAPES.map(s=>(
            <button key={s} onClick={()=>setShape(s)} className={`p-2 rounded-xl border grid place-items-center ${shape===s?'bg-black/10 border-black':'bg-black border-gray-300'}`} aria-label={s}>
              <ShapePreview shape={s} color="#ffffff" size={36}/>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">소리</div>
        <div className="flex flex-wrap gap-2">
          {SOUNDS.map(s=>(
            <button key={s} onClick={()=>setSound(s)} className={`px-3 py-1.5 rounded-full border ${sound===s?'bg-black text-white':'bg-white'}`}>{s}</button>
          ))}
        </div>
        <div className="mt-2">
          <button onClick={togglePlay} className="px-3 py-1.5 rounded-xl bg-gray-800 text-white">소리 미리듣기</button>
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">위치</div>
        <button onClick={grabLocation} className="px-3 py-1.5 rounded-xl border">위치 가져오기</button>
        {loc.lat!=null && loc.lng!=null ? (
          <div className="text-xs text-black/60 mt-2">lat {loc.lat}, lng {loc.lng}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={save} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">저장</button>
      </div>

      <p className="mt-3 text-xs text-black/50">저장 시 AI 분석 결과를 함께 저장합니다.</p>
    </div>
  )
}
