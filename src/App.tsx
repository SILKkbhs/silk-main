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
import Home from '@/components/Home' // ✅ 추가
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// ✅ home 추가
type Tab = 'home' | 'feed' | 'profile' | 'explore'
type Route = Tab | 'write' | 'login' | 'signup' | 'history'

// ✅ 기본 해시를 home으로 설정하고 허용 목록에도 home 추가
const parseHash = (): Route => {
  const h = (location.hash || '#home').slice(1)
  const allow: Route[] = ['home', 'feed', 'profile', 'explore', 'write', 'login', 'signup', 'history']
  return (allow as readonly string[]).includes(h) ? (h as Route) : 'home'
}

const isTab = (r: Route): r is Tab =>
  r === 'home' || r === 'feed' || r === 'profile' || r === 'explore'

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash())
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // 인증 상태 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
    })
    return () => unsub()
  }, [])

  // 해시 라우팅
  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 스플래시 후 이동
  const nextHash = authReady ? (user ? '#home' : '#login') : '#login'

  // 본문 렌더
  let content: React.ReactNode = null
  if (!authReady) {
    content = <div className="grid place-items-center h-[70vh] text-sm text-gray-500">로딩중…</div>
  } else {
    content = (
      <>
        {route === 'login' && <Login />}
        {route === 'signup' && <Signup />}
        {route === 'home' && <Home />}       {/* ✅ 홈 화면 추가 */}
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
      <IntroSplash mode="auto" nextHash={nextHash} />

      <main className="max-w-5xl mx-auto px-4 py-4">
        {content}
      </main>

      <TabBar current={isTab(route) ? route : 'home'} /> {/* ✅ 기본 탭 home으로 */}
    </div>
  )
}
