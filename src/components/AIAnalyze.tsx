import React, { useState } from 'react'
import { ref, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { predictEmotion, type PredictResult } from '@/lib/ai'

export type EmotionCard = {
  id: string
  userId: string
  color: string
  shape?: string
  sound?: string
  timestamp: number
  likes?: number
  ai?: PredictResult
  lat?: number
  lng?: number
}

export function useAIAnalysis() {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ cardId: string; result: PredictResult } | null>(null)

  async function run(card: EmotionCard, persist = true) {
    if (busyId) return
    setBusyId(card.id)

    if (card.ai) {
      setModal({ cardId: card.id, result: card.ai })
      setBusyId(null)
      return
    }
    try {
      const result = await predictEmotion({ color: card.color, shape: card.shape, sound: card.sound })
      setModal({ cardId: card.id, result })
      if (persist) await update(ref(rtdb, `emotions/${card.id}`), { ai: result })
    } catch (e) {
      alert('AI 분석 실패: API 주소/CORS 확인 필요')
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }
  return { busyId, modal, setModal, run }
}

export function AIAnalyzeButton({ card, run, busyId, small=false }:{ card: EmotionCard, run:(c:EmotionCard)=>void, busyId:string|null, small?:boolean }) {
  return (
    <button onClick={()=>run(card)} disabled={!!busyId}
      className={`inline-flex items-center border rounded-lg ${small?'px-2 py-1 text-[10px]':'px-3 py-1.5 text-xs'} ${busyId===card.id?'bg-gray-100 text-gray-400':'bg-white hover:bg-gray-50'} transition`}>
      {busyId===card.id?'분석중…':'⚡AI'}
    </button>
  )
}

export function AIResultModal({ modal, onClose }:{ modal:{cardId:string; result: PredictResult} | null, onClose: ()=>void }) {
  if (!modal) return null
  const { result } = modal
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
      <div onClick={e=>e.stopPropagation()} className="w-[360px] max-w-[92%] bg-white rounded-2xl p-5 shadow-xl border">
        <h3 className="font-bold text-lg mb-2">AI 감정 분석</h3>
        <p className="mb-1">예측 감정: <b>{result.label}</b></p>
        <p className="mb-3">신뢰도: <b>{Math.round((result.score||0)*100)}%</b></p>
        {!!result.tips?.length && (
          <div className="text-sm">
            <div className="text-gray-500 mb-1">케어 팁</div>
            <ul className="list-disc pl-5">{result.tips.map((t,i)=>(<li key={i}>{t}</li>))}</ul>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  )
}
