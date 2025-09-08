// src/components/IntroSplash.tsx
'use client'
import React, { useEffect, useState } from 'react'

type Mode = 'auto' | 'hold'

export default function IntroSplash({
  mode = 'auto',
  nextHash = '#feed',
  onDone,
}: {
  mode?: Mode
  nextHash?: string
  onDone?: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')

    // 모션 줄이기: 인트로는 정적으로 잠깐 보여주고 이동
    if (mq?.matches) {
      setVisible(true)
      if (mode === 'auto') {
        const t = setTimeout(() => {
          setVisible(false)
          onDone?.()
          if (nextHash) location.hash = nextHash
        }, 1200) // 정적 0.8s
        return () => clearTimeout(t)
      }
      return
    }

    // 일반 모드
    setVisible(true)
    if (mode === 'auto') {
      const t1 = setTimeout(() => setFading(true), 1400)
      const t2 = setTimeout(() => {
        setVisible(false)
        onDone?.()
        if (nextHash) location.hash = nextHash
      }, 1800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [mode, nextHash, onDone])

  if (!visible && mode === 'auto') return null

  return (
    <div
      className={`fixed inset-0 z-[9999] grid place-items-center bg-white
                  ${mode === 'auto' && fading ? 'intro-fade-out' : ''}`}
      aria-label="Intro overlay"
      role="dialog"
    >
      <div className="w-[280px] sm:w-[360px] relative select-none">
        <svg viewBox="0 0 358 504" className="w-[160px] mx-auto intro-stretch" aria-label="SILK logo">
          <defs>
            <linearGradient id="silkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8877E6" />
              <stop offset="50%" stopColor="#788AE6" />
              <stop offset="100%" stopColor="#77ACE6" />
            </linearGradient>
          </defs>
          <path
            d="M296 28c-34-19-75-31-118-15-33 12-114 58-174 111-27 24-62 56 18 75 72 17 187 31 14 127-191 106-52 184 152 264 43 16 122 0 108-36-14-36-238-111-161-195 50-54 118-92 143-108 11-7 29-12 29-20 1-20-62-41-102-63-108-58 57-95 134-140 26-15 31-25 3-40z"
            fill="url(#silkGrad)"
          />
        </svg>

        <div className="mt-6 text-center text-4xl sm:text-5xl font-extrabold
                        bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]
                        bg-clip-text text-transparent tracking-tight intro-word-reveal">
          SILK
        </div>
        <div className="mt-2 text-center text-sm text-white/60 intro-sub-reveal">
          sense • image • line • kinesthetics
        </div>
      </div>
    </div>
  )
}
