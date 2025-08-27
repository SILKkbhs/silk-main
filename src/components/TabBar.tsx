'use client'
import React from 'react'

type Tab = 'feed' | 'profile' | 'explore'

export default function TabBar({ current }: { current: Tab }) {
  const Item = (t: Tab, label: string) => {
    const active = current === t
    return (
      <a
        key={t}
        href={`#${t}`}
        className={`px-4 py-2 rounded-full text-sm transition border
          ${active
            ? 'text-white border-transparent bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] shadow-md'
            : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50'}`}
      >
        {label}
      </a>
    )
  }

  return (
    <nav className="sticky bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 justify-center">
        {Item('feed', 'Feed')}
        {Item('profile', 'Profile')}
        {Item('explore', 'Explore')}
      </div>
    </nav>
  )
}
