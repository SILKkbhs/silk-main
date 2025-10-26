'use client'

import React, { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Tab = 'home' | 'profile' | 'explore' | 'login'

export default function TabBar({ current }: { current: Tab }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 로그인 상태 감시
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // 로그아웃 처리
  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
    alert('로그아웃 되었습니다.')
  }

  // 이메일에서 @ 뒤를 제거하는 함수
  const getUsername = (email: string | null | undefined) => {
    if (!email) return ''
    return email.split('@')[0] // '@' 앞부분만 반환
  }

  const Logo = () => (
    <a href="#home" className="flex items-center space-x-3">
      <img
        src="/logo.png"
        alt="Sensory Echo Logo"
        width={130}
        height={10}
      />
    </a>
  )

  const Item = (t: Tab, label: string) => {
    const active = current === t
    return (
      <a
        key={t}
        href={`#${t}`}
        className={`relative text-base font-medium py-2 transition-all duration-300
          ${
            active
              ? 'text-white border-b-2 border-indigo-400'
              : 'text-gray-400 hover:text-white'
          }`}
      >
        {label}
        {active && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]" />
        )}
      </a>
    )
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-20 bg-[#1a1a2e] shadow-xl border-b border-gray-700/50">
      <div className="max-w-5xl mx-auto h-16 px-6 flex items-center justify-between">
        {/* 좌측 로고 */}
        <Logo />

        {/* 우측 메뉴 */}
        <div className="flex items-center space-x-8">
          {Item('home', 'Home')}
          {Item('profile', 'Profile')}
          {Item('explore', 'Explore')}

          {/* 로그인 여부에 따라 표시 전환 */}
          {user ? (
            <div className="flex items-center space-x-3 text-white">
              <span className="text-sm font-medium">
                {getUsername(user.email)}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 text-xs underline underline-offset-2"
              >
                로그아웃
              </button>
            </div>
          ) : (
            Item('login', 'Login')
          )}
        </div>
      </div>
    </nav>
  )
}
