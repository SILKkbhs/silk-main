// src/App.tsx
import React, { useEffect, useState } from 'react'
import TabBar from '@/components/TabBar'
import Feed from '@/components/Feed'
import Write from '@/components/Write'
import Explore from '@/components/Explore'
import Login from '@/components/Login'
import Signup from '@/components/Signup'
import History from '@/components/History'
import Profile from '@/components/Profile'
import IntroSplash from '@/components/IntroSplash'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Tab = 'feed' | 'profile' | 'explore'
type Route = Tab | 'write' | 'login' | 'signup' | 'history'

const parseHash = (): Route => {
  const h = (location.hash || '#feed').slice(1)
  const allow: Route[] = ['feed', 'profile', 'explore', 'write', 'login', 'signup', 'history']
  return (allow as readonly string[]).includes(h) ? (h as Route) : 'feed'
}
const isTab = (r: Route): r is Tab => r === 'feed' || r === 'profile' || r === 'explore'

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash())
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // 1) 인증 상태 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  // 2) 해시 라우팅
  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 3) 스플래시 종료 후 어디로 보낼지
  const nextHash = authReady ? (user ? '#feed' : '#login') : '#login'

  // 4) 본문 렌더
  let content: React.ReactNode = null
  if (!authReady) {
    content = <div className="grid place-items-center h-[70vh] text-sm text-gray-500">로딩중…</div>
  } else {
    content = (
      <>
        {route === 'login' && <Login />}
        {route === 'signup' && <Signup />}
        {route === 'feed' && <Feed />}
        {route === 'profile' && <Profile />}
        {route === 'explore' && <Explore />}
        {route === 'write' && <Write />}
        {route === 'history' && <History />}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 앱 시작 시 스플래시: 끝나면 nextHash로 이동 */}
      <IntroSplash mode="auto" nextHash={nextHash} />

      <main className="max-w-5xl mx-auto px-4 py-4">
        {content}
      </main>

      <TabBar current={isTab(route) ? route : 'feed'} />
    </div>
  )
}
