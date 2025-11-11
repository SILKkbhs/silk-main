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

    // 모션 줄이기
    if (mq?.matches) {
      setVisible(true)
      if (mode === 'auto') {
        const t = setTimeout(() => {
          setVisible(false)
          onDone?.()
          if (nextHash) location.hash = nextHash
        }, 1200)
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
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
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
      <div className="w-[380px] sm:w-[460px] relative select-none overflow-visible">
        {/* ==== 로고 SVG (패딩 + 축소로 잘림 방지) ==== */}
        <svg
          viewBox="-64 -64 486 632"
          preserveAspectRatio="xMidYMid meet"
          className="w-[180px] mx-auto overflow-visible"
          aria-label="SILK logo"
        >
          <defs>
            <linearGradient id="silkGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8877E6" />
              <stop offset="50%" stopColor="#788AE6" />
              <stop offset="100%" stopColor="#77ACE6" />
            </linearGradient>
          </defs>
          <g transform="translate(179 252) scale(0.92) translate(-179 -252)">
            <path
              d="M296 28c-34-19-75-31-118-15-33 12-114 58-174 111-27 24-62 56 18 75 72 17 187 31 14 127-191 106-52 184 152 264 43 16 122 0 108-36-14-36-238-111-161-195 50-54 118-92 143-108 11-7 29-12 29-20 1-20-62-41-102-63-108-58 57-95 134-140 26-15 31-25 3-40z"
              fill="url(#silkGrad)"
            />
          </g>
        </svg>

        {/* ==== 텍스트 ==== */}
        <div
          className="mt-6 text-center text-4xl sm:text-5xl font-extrabold
                     bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]
                     bg-clip-text text-transparent tracking-tight intro-word-reveal"
        >
          SILK
        </div>
        <div className="mt-2 text-center text-sm text-white/60 intro-sub-reveal">
          sense • image • line • kinesthetics
        </div>
      </div>

      {/* ==== 애니메이션 ==== */}
      <style>{`
        @keyframes introFadeOut {
          from { opacity: 1 }
          to { opacity: 0 }
        }
        .intro-fade-out {
          animation: introFadeOut 0.4s ease forwards;
        }

        @keyframes wordReveal {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-word-reveal {
          animation: wordReveal 0.8s 0.2s ease-out both;
        }

        @keyframes subReveal {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .intro-sub-reveal {
          animation: subReveal 0.7s 0.4s ease-out both;
        }
      `}</style>
    </div>
  )
}
