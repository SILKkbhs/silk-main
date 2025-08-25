import React, { useEffect, useMemo, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { AIAnalyzeButton, AIResultModal, useAIAnalysis, type EmotionCard } from '@/components/AIAnalyze'

export default function History() {
  const [cards, setCards] = useState<EmotionCard[]>([])
  const { busyId, modal, setModal, run } = useAIAnalysis()
  const myUid = typeof window !== 'undefined' ? localStorage.getItem('currentUser') || '' : ''

  useEffect(() => {
    const unsub = onValue(ref(rtdb, 'emotions'), (snap) => {
      const v = snap.val() || {}
      setCards(Object.values(v))
    })
    return () => unsub()
  }, [])

  const mine = useMemo(() => cards.filter(c=>c.userId===myUid).sort((a,b)=>b.timestamp-a.timestamp), [cards, myUid])

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">나의 히스토리</h2>
      {!myUid && <div className="text-sm text-rose-600">로그인이 필요합니다.</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {mine.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-white shadow-sm p-3">
            <div className="h-36 rounded-xl grid place-items-center text-white font-bold" style={{ background: c.color }}>{c.shape}</div>
            <div className="mt-2 flex items-center justify-between">
              <small className="text-gray-500">{new Date(c.timestamp).toLocaleString()}</small>
              <AIAnalyzeButton card={c} run={run} busyId={busyId} />
            </div>
            {!!c.ai && <div className="mt-1 text-xs text-gray-600">AI: {c.ai.label}</div>}
          </div>
        ))}
      </div>
      <AIResultModal modal={modal} onClose={()=>setModal(null)} />
    </section>
  )
}
