import React, { useEffect, useState } from 'react'
import { ref, set } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { rtdb, auth } from '@/lib/firebase'

export default function Write() {
  const [uid, setUid] = useState<string | null>(null)
  const [color, setColor] = useState('#ff8aa1')
  const [shape, setShape] = useState('circle')
  const [sound, setSound] = useState('ding')

  // 로그인 상태 감지
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null)
    })
    return () => unsub()
  }, [])

  const onSave = async () => {
    if (!uid) {
      alert('로그인이 필요합니다. 로그인 탭으로 이동합니다.')
      location.hash = 'login'
      return
    }
    const id = `${uid}_${Date.now()}`
    await set(ref(rtdb, `emotions/${id}`), {
      id,
      userId: uid,
      color,
      shape,
      sound,
      timestamp: Date.now(),
      likes: 0,
    })
    alert('저장 완료! Feed 탭에서 확인해보세요.')
    location.hash = 'feed'
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">감정 카드 작성</h2>
        <span className={`text-xs ${uid ? 'text-green-600' : 'text-rose-600'}`}>
          {uid ? '로그인됨' : '로그인 필요'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          색상:
          <input className="ml-2" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label className="text-sm">
          모양:
          <select className="ml-2 border rounded-lg px-2 py-1" value={shape} onChange={(e) => setShape(e.target.value)}>
            <option value="circle">원</option>
            <option value="triangle">삼각형</option>
            <option value="square">사각형</option>
          </select>
        </label>
        <label className="text-sm">
          소리:
          <select className="ml-2 border rounded-lg px-2 py-1" value={sound} onChange={(e) => setSound(e.target.value)}>
            <option value="ding">ding</option>
            <option value="bubble">bubble</option>
            <option value="chime">chime</option>
          </select>
        </label>
        <button onClick={onSave} className="px-3 py-1.5 border rounded-lg hover:bg-gray-50">
          저장
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-40 h-32 rounded-xl grid place-items-center text-white font-bold" style={{ background: color }}>
          {shape}
        </div>
        <audio controls src={`/sounds/${sound}.mp3`} />
      </div>
    </section>
  )
}
