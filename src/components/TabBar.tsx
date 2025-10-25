'use client'


type Tab = 'home' | 'feed' | 'profile' | 'explore'

export default function TabBar({ current }: { current: Tab }) {
  
  // 로고 컴포넌트 수정: Image 컴포넌트를 사용하여 이미지와 텍스트를 함께 표시
  const Logo = () => (
    <a href="#home" className="flex items-center space-x-3">
      {/* next/image 대신 일반 <img> 태그 사용 */}
      <img
        src="/logo.png" // 👈 로고 파일 경로. (public 폴더에 넣어주세요)
        alt="Sensory Echo Logo"
        width={150}
        height={150}
      />
      {/* 2. 텍스트 로고 (사이트 이름) */}
     
    </a>
  )
  
  const Item = (t: Tab, label: string) => {
    const active = current === t
    return (
      <a
        key={t}
        href={`#${t}`}
        className={`relative text-base font-medium py-2 transition-all duration-300
          ${active
            // 활성화: 텍스트 색상을 흰색으로 강조하고, 밑줄 효과를 줍니다.
            ? 'text-white border-b-2 border-indigo-400' 
            // 비활성화: 옅은 회색 텍스트, 호버 시 흰색으로 변경
            : 'text-gray-400 hover:text-white'}`}
      >
        {label}
        {/* 활성 탭의 그라데이션 밑줄 (미니멀 스타일) */}
        {active && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6]"></div>
        )}
      </a>
    )
  }

  return (
    // 상단 고정, 어두운 배경, 아래 경계선으로 일반적인 웹 탭바 스타일 적용
    <nav className="fixed top-0 inset-x-0 z-20 bg-[#1a1a2e] shadow-xl border-b border-gray-700/50">
      <div className="max-w-5xl mx-auto h-16 px-6 flex items-center justify-between">
        
        {/* 1. 로고 (좌측 정렬) */}
        <Logo />

        {/* 2. 메뉴 항목 (우측 정렬) */}
        <div className="flex items-center space-x-8">
          {Item('home', 'Home')}
          {Item('feed', 'Feed')}
          {Item('profile', 'Profile')}
          {Item('explore', 'Explore')}
        </div>
      </div>
    </nav>
  )
}