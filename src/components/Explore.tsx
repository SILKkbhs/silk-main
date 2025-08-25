import React, { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { AIAnalyzeButton, AIResultModal, useAIAnalysis, type EmotionCard } from '@/components/AIAnalyze'

export default function Explore() {
  const [cards, setCards] = useState<EmotionCard[]>([])
  const { busyId, modal, setModal, run } = useAIAnalysis()

  useEffect(() => {
    const unsub = onValue(ref(rtdb, 'emotions'), snap => {
      const v = snap.val() || {}
      setCards(Object.values(v))
    })
    return () => unsub()
  }, [])

  const withGeo = cards.filter(c => typeof c.lat === 'number' && typeof c.lng === 'number')

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">탐색 (지도/트렌드)</h2>
      <p className="text-sm text-gray-500">데모에서는 먼저 목록형으로 동작 확인 후 지도 연결</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(withGeo.length?withGeo:cards).map(c => (
          <div key={c.id} className="rounded-2xl border bg-white shadow-sm p-3">
            <div className="h-28 rounded-xl" style={{ background: c.color }} />
            <div className="mt-2 flex items-center justify-between">
              <small className="text-gray-500">{(c.lat?.toFixed?.(3)??'-')}, {(c.lng?.toFixed?.(3)??'-')}</small>
              <AIAnalyzeButton card={c} run={run} busyId={busyId} small />
            </div>
            {!!c.ai && <div className="mt-1 text-xs text-gray-600">AI: {c.ai.label}</div>}
          </div>
        ))}
      </div>
      <AIResultModal modal={modal} onClose={()=>setModal(null)} />
    </section>
  )
}
