'use client'
import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>('')
  const [info, setInfo] = useState<string>('')

  const msg = (code?: string, fallback = '로그인에 실패했습니다. 입력 내용을 확인해 주세요.') => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return '이메일 또는 비밀번호가 올바르지 않습니다.'
      case 'auth/user-not-found':
        return '해당 이메일로 가입된 계정을 찾을 수 없어요.'
      case 'auth/too-many-requests':
        return '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.'
      case 'auth/popup-blocked':
      case 'auth/popup-closed-by-user':
        return '브라우저가 팝업을 막았어요. 팝업 허용 후 다시 시도해 주세요.'
      case 'auth/account-exists-with-different-credential':
        return '이 이메일은 다른 로그인 방식으로 이미 가입되어 있어요. Google로 시도해 보세요.'
      default:
        return fallback
    }
  }

  const onGoogle = async () => {
    setError(''); setInfo(''); setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      location.hash = 'feed'
    } catch (e: any) {
      setError(msg(e?.code, 'Google 로그인에 실패했습니다.'))
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim())
      location.hash = 'feed'
    } catch (e: any) {
      setError(msg(e?.code))
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setError(''); setInfo('')
    const target = email.trim()
    if (!target) {
      setError('비밀번호 재설정을 위해 이메일을 먼저 입력해 주세요.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, target)
      setInfo('비밀번호 재설정 이메일을 보냈어요. 메일함을 확인해 주세요.')
    } catch (e: any) {
      setError(msg(e?.code, '재설정 메일 전송에 실패했습니다.'))
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">로그인</h1>

        {/* Google */}
        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="w-full py-3 rounded-lg font-semibold text-white mb-4
                     bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] shadow-md disabled:opacity-60"
        >
          {busy ? '로그인 중…' : 'Google로 계속하기'}
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="border-t"></div>
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-xs text-gray-400">
            또는 이메일로 로그인
          </span>
        </div>

        {/* Email form */}
        <form onSubmit={onEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#788AE6]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#788AE6]"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg font-semibold text-white bg-gray-900 hover:bg-black transition disabled:opacity-60"
          >
            이메일로 로그인
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-sm">
          <button onClick={onReset} className="text-gray-600 hover:text-gray-900 underline underline-offset-2">
            비밀번호 재설정
          </button>
          <a href="#signup" className="text-[#788AE6] font-semibold hover:underline">
            회원가입
          </a>
        </div>
      </div>
    </div>
  )
}
