'use client'
import React from 'react'
type Tab = 'feed' | 'write' | 'explore' | 'history'
export default function TabBar({ current }: { current: Tab }) {
  const Item = (t: Tab, label: string) => (
    <a key={t} href={`#${t}`}
      className={`px-4 py-2 rounded-full border text-sm transition ${current===t?'bg-black text-white border-black':'bg-white text-black border-gray-200 hover:bg-gray-50'}`}>
      {label}
    </a>
  )
  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
        <div className="font-extrabold tracking-tight mr-2">SILK</div>
        {Item('feed','Feed')}
        {Item('write','Write')}
        {Item('explore','Explore')}
        {Item('history','History')}
      </div>
    </nav>
  )
}
