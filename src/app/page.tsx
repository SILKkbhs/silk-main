'use client'
import React, { useEffect, useState } from 'react'
import TabBar from '@/components/TabBar'
import Feed from '@/components/Feed'
import Profile from '@/components/Profile'
import Explore from '@/components/Explore'
import Write from '@/components/Write'
import Login from '@/components/Login'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

// 1) 탭과 라우트 타입 분리
type Tab = 'feed' | 'profile' | 'explore'
type Route = Tab | 'write' | 'login' | 'history' // 필요시 추가

// 2) 현재 해시를 안전하게 Route로 파싱
const parseHash = (): Route => {
  const h = (location.hash || '#feed').slice(1)
  const allow: Route[] = ['feed', 'profile', 'explore', 'write', 'login', 'history']
  return (allow as readonly string[]).includes(h) ? (h as Route) : 'feed'
}

// 3) Route가 Tab인지 판별
const isTab = (r: Route): r is Tab => r === 'feed' || r === 'profile' || r === 'explore'

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash())
  const [authed, setAuthed] = useState<boolean>(false)
  const [authReady, setAuthReady] = useState<boolean>(false)

  // 로그인 상태 감시
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthed(!!u)
      setAuthReady(true)
      // 비로그인인데 탭/작성/히스토리 들어오면 로그인으로
      if (!u) {
        const r = parseHash()
        if (r !== 'login') location.hash = 'login'
      }
    })
    return () => unsub()
  }, [])

  // 해시 라우팅
  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 첫 렌더 보호
  if (!authReady) return <div className="grid place-items-center h-[60vh] text-gray-500">로딩 중…</div>

  // 인증 가드: 로그인만 예외
  if (!authed && route !== 'login') {
    return <Login />
  }

  // 뷰 렌더
  return (
    <main className="min-h-screen bg-gray-50">
      {route === 'login' && <Login />}
      {route === 'feed' && <Feed />}
      {route === 'profile' && <Profile />}
      {route === 'explore' && <Explore />}
      {route === 'write' && <Write />}
      {route === 'history' && <div className="p-4 text-gray-500">History 컴포넌트 연결해</div>}

      {/* 4) TabBar에는 탭만 넘김. 로그인 등 비탭 라우트면 기본값 'feed' */}
      <TabBar current={isTab(route) ? route : 'feed'} />
    </main>
  )
}
