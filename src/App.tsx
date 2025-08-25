// src/App.tsx
import React, { useEffect, useState } from 'react'
import TabBar from '@/components/TabBar'
import Feed from '@/components/Feed'
import Write from '@/components/Write'
import Explore from '@/components/Explore'
import Login from '@/components/Login'
import Signup from '@/components/Signup'
import History from '@/components/History'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Tab = 'feed' | 'write' | 'explore' | 'login' | 'signup' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('feed')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
      if (!u) location.hash = 'login'   // 비로그인 상태면 해시를 로그인으로 고정
    })
    const onHash = () => {
      const t = (location.hash.replace('#', '') || 'feed') as Tab
      setTab(t)
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => { unsubAuth(); window.removeEventListener('hashchange', onHash) }
  }, [])

  if (loading) {
    return <div className="grid place-items-center h-screen text-sm text-gray-500">로딩중…</div>
  }

  // 로그인 전: 무조건 로그인 화면만 노출
  if (!user) {
    return (
      <main className="max-w-md mx-auto px-4 py-10">
        <Login />
      </main>
    )
  }

  // 로그인 후: 정상 탭 UI
  return (
    <div className="min-h-screen">
      <TabBar current={tab as any} />
      <main className="max-w-5xl mx-auto px-4 py-4">
        {tab === 'feed' && <Feed />}
        {tab === 'write' && <Write />}
        {tab === 'explore' && <Explore />}
        {tab === 'history' && <History />}
        {/* 로그인/회원가입 탭은 로그인 후 숨겨도 되지만 혹시 남아있다면 강제로 피드로 돌림 */}
        {(tab === 'login' || tab === 'signup') && <Feed />}
      </main>
    </div>
  )
}
