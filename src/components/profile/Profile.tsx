// src/components/Profile.tsx
'use client'
import React from 'react'
import HistoryTimeline from '../HistoryTimeline'

export default function Profile() {
  const goWrite = () => { location.hash = '#write' }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로필</h1>
          <p className="text-sm text-gray-500">내 기록과 AI 분석을 모아봅니다.</p>
        </div>

        {/* 프로필에서 바로 작성 화면으로 이동 */}
        <button
          onClick={goWrite}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white
                     bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          aria-label="새 감정 작성하기"
        >
          <span>새 실크 작성</span>
          <span aria-hidden>＋</span>
        </button>
      </header>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">히스토리</h2>
        <HistoryTimeline />
      </section>
    </div>
  )
}
