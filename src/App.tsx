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
import Home from '@/components/Home'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Tab = 'home' | 'profile' | 'explore'
type Route = Tab | 'write' | 'login' | 'signup' | 'history'

const parseHash = (): Route => {
  const h = (location.hash || '#home').slice(1)
  const allow: Route[] = ['home', 'profile', 'explore', 'write', 'login', 'signup', 'history']
  return (allow as readonly string[]).includes(h) ? (h as Route) : 'home'
}

const isTab = (r: Route): r is Tab =>
  r === 'home' || r === 'profile' || r === 'explore'

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

  // nextHash 로직: 인증 상태에 따라 강제 이동 경로 결정
  const nextHash = (() => {
    if (!authReady) return '#login'

    if (user) {
      if (route === 'login' || route === 'signup') {
        return '#home' 
      }
      return `#${route}`
    }
    
    if (route !== 'login' && route !== 'signup') {
      return '#login'
    }
    return `#${route}`
  })();


  // 본문 렌더 로직: 인증 상태에 따라 렌더링되는 컴포넌트를 분리
  let content: React.ReactNode = null
  
  if (!authReady) {
    content = <div className="grid place-items-center h-[70vh] text-sm text-gray-500">로딩중…</div>
  } else if (user) {
    // 로그인 상태: 모든 인증 필요 페이지 접근 가능
    content = (
      <>
        {route === 'home' && <Home />}
        {route === 'profile' && <Profile />}
        {route === 'explore' && <Explore />}
        {route === 'write' && <Write />}
        {route === 'history' && <History />}
      </>
    )
  } else {
    // 로그아웃 상태: 로그인/회원가입 페이지만 렌더링
    content = (
      <>
        {route === 'login' && <Login />}
        {route === 'signup' && <Signup />}
        {route !== 'login' && route !== 'signup' && (
          <div className="grid place-items-center h-[70vh] text-sm text-red-500">로그인이 필요합니다.</div>
        )}
      </>
    )
  }

  const shouldShowTabBar = authReady && user && isTab(route);
  const currentTab = isTab(route) ? route : 'home';


  return (
    <div className="min-h-screen bg-gray-50">
      <IntroSplash mode="auto" nextHash={nextHash} /> 

      <main className="max-w-5xl mx-auto px-4 py-4">
        {content}
      </main>

      {shouldShowTabBar && <TabBar current={currentTab} />}
    </div>
  )
}