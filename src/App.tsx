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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthReady(true)
      if (!u && route !== 'login') location.hash = 'login'
    })
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => { unsubAuth(); window.removeEventListener('hashchange', onHash) }
  }, [route])

  if (!authReady) {
    return <div className="grid place-items-center h-screen text-sm text-gray-500">로딩중…</div>
  }

  if (!user && route !== 'login') {
    return (
      <main className="max-w-md mx-auto px-4 py-10">
        <Login />
      </main>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-4">
        {route === 'login' && <Login />}
        {route === 'signup' && <Signup />}
        {route === 'feed' && <Feed />}
        {route === 'profile' && <Profile />}
        {route === 'explore' && <Explore />}
        {route === 'write' && <Write />}
        {route === 'history' && <History />}
      </main>
      <TabBar current={isTab(route) ? route : 'feed'} />
    </div>
  )
}
