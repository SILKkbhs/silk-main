import React, { useEffect, useMemo, useState } from 'react'
import { ref, onValue, get, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { AIAnalyzeButton, AIResultModal, useAIAnalysis, type EmotionCard } from '@/components/AIAnalyze'

function hasLiked(id: string) {
  const raw = localStorage.getItem('liked') || '[]'
  return JSON.parse(raw).includes(id)
}
function pushLiked(id: string) {
  const raw = localStorage.getItem('liked') || '[]'
  const arr = JSON.parse(raw)
  if (!arr.includes(id)) arr.push(id)
  localStorage.setItem('liked', JSON.stringify(arr))
}

export default function Feed() {
  const [cards, setCards] = useState<EmotionCard[]>([])
  const { busyId, modal, setModal, run } = useAIAnalysis()

  useEffect(() => {
    const emotionsRef = ref(rtdb, 'emotions')
    const unsub = onValue(emotionsRef, (snap) => {
      const val = snap.val() || {}
      const list: EmotionCard[] = Object.values(val)
      setCards(list)
    })
    return () => unsub()
  }, [])

  const recent = useMemo(() => {
    const now = Date.now()
    return cards.filter(c => now - c.timestamp <= 24*60*60*1000).sort((a,b)=>b.timestamp-a.timestamp)
  }, [cards])

  async function likeCard(id: string) {
    if (hasLiked(id)) return
    const s = await get(ref(rtdb, `emotions/${id}/likes`))
    const cur = s.val() || 0
    await update(ref(rtdb, `emotions/${id}`), { likes: cur + 1 })
    pushLiked(id)
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">최근 24시간 카드</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {recent.map(c => (
          <div key={c.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-3">
            <div className="h-28 rounded-xl" style={{ background: c.color }} />
            <div className="mt-2 flex items-center justify-between">
              <small className="text-gray-500">{new Date(c.timestamp).toLocaleString()}</small>
              <div className="flex items-center gap-2">
                <button onClick={()=>likeCard(c.id)} className="text-sm">❤ {c.likes || 0}</button>
                <AIAnalyzeButton card={c} run={run} busyId={busyId} small />
              </div>
            </div>
            {!!c.ai && <div className="mt-1 text-xs text-gray-600">AI: {c.ai.label} ({Math.round((c.ai.score||0)*100)}%)</div>}
          </div>
        ))}
      </div>
      <AIResultModal modal={modal} onClose={()=>setModal(null)} />
    </section>
  )
}
