// src/components/Signup.tsx
'use client'
import React, { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>('')

  const msg = (code?: string, fallback = '회원가입에 실패했습니다.') => {
    switch (code) {
      case 'auth/email-already-in-use': return '이미 사용 중인 이메일입니다.'
      case 'auth/invalid-email': return '이메일 형식이 올바르지 않습니다.'
      case 'auth/weak-password': return '비밀번호가 너무 약합니다. 6자 이상으로 설정하세요.'
      default: return fallback
    }
  }

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('이메일과 비밀번호를 입력하세요.')
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.')
    try {
      setBusy(true)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (displayName) await updateProfile(cred.user, { displayName })
      try { await sendEmailVerification(cred.user) } catch {}
      // 가입 직후 메인으로 이동
      location.hash = 'feed'
    } catch (e: any) {
      setError(msg(e?.code))
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>
        <form onSubmit={onSignup} className="space-y-3">
          <input className="w-full p-3 border rounded-lg" placeholder="이메일"
            type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full p-3 border rounded-lg" placeholder="비밀번호"
            type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="w-full p-3 border rounded-lg" placeholder="비밀번호 확인"
            type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60">
            {busy ? '처리 중…' : '가입하기'}
          </button>
        </form>
        <div className="text-sm text-center mt-4">
          <a href="#login" className="text-indigo-600 hover:underline">이미 계정이 있나요? 로그인</a>
        </div>
      </div>
    </div>
  )
}
