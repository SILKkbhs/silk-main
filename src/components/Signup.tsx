import React, { useState } from 'react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const handleSignup = () => {
    if (password !== confirm) return alert('비밀번호가 일치하지 않습니다.')
    alert(`회원가입은 데모에서 비활성화됨. 로그인 탭을 이용해 주세요.`)
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>
        <input className="w-full p-3 border rounded-lg mb-3" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-3 border rounded-lg mb-3" placeholder="비밀번호" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input className="w-full p-3 border rounded-lg mb-3" placeholder="비밀번호 확인" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        <button onClick={handleSignup} className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition">회원가입</button>
      </div>
    </div>
  )
}
