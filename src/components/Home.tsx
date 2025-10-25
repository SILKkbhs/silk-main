'use client';
import React from 'react';

// Main call-to-action buttons for navigation
const mainButtons = [
  { 
    href: '#write', 
    label: '내 감정 기록하기', 
    style: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold' 
  },
  { 
    href: '#explore', 
    label: '다른 감정 탐색하기', 
    style: 'bg-transparent text-indigo-600 border border-indigo-200 hover:bg-indigo-50' 
  },
];

// Core elements with cleaner icons and descriptions
const coreElements = [
  { 
    title: "Sound", 
    description: "내면의 울림을 멜로디와 주파수로 시각화하고 청각화합니다.",
    icon: (
      // Clean SVG for sound wave / frequency
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M6 17v-10M18 17v-10" />
      </svg>
    )
  },
  { 
    title: "Shape", 
    description: "복잡한 감정 상태를 미니멀한 도형과 컬러 스펙트럼으로 표현합니다.",
    icon: (
      // Clean SVG for shape / geometry
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
      </svg>
    )
  },
  { 
    title: "Emotion", 
    description: "안전하고 사려 깊은 커뮤니티에서 진실된 감정을 공유하고 공감합니다.",
    icon: (
      // Clean SVG for connection / emotion
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 11.53V21M7 21v-8.47M3 13.5v-3h18v3" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
];

export default function Home() {
  return (
    // 최상위 div에서 padding 제거 및 w-full 추가
    <div className="flex flex-col items-center text-center w-full">
      {/* 1. Main Slogan Section - Elevated Design */}
      <section className="py-20 md:py-32 max-w-4xl px-4 sm:px-0"> {/* padding을 section으로 이동 */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light text-gray-900 mb-6 leading-tight tracking-tight">
          당신의 감정,
          <br />
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-600">
            Silk로 기록되다.
          </span>
        </h1>
        
        <p className="text-xl text-gray-500 mb-12 font-light max-w-2xl mx-auto">
          말이 아닌 소리와 형태로, 당신의 가장 순수한 내면을 섬세하게 표현하고 교류하는
          <br className="hidden sm:inline" />
          감각적인 미디어 플랫폼입니다.
        </p>

        {/* Call-to-action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {mainButtons.map((button) => (
            <a
              key={button.href}
              href={button.href}
              className={`py-3 px-10 rounded-full text-base font-medium transition duration-300 transform hover:scale-[1.02] whitespace-nowrap shadow-md ${button.style}`}
            >
              {button.label}
            </a>
          ))}
        </div>
      </section>

      {/* 2. Core Elements Section - Minimalist Cards */}
      {/* 테두리 대신 경계를 위해 border-t를 사용하고, 배경은 메인 컨테이너에 의존 */}
      <section className="w-full pt-16 border-t border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-800 mb-12">
          Silk의 표현 언어
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 sm:px-0 pb-16"> {/* padding 추가 */}
          {coreElements.map((card, index) => (
            <div 
              key={index} 
              // 카드 자체의 배경과 테두리는 유지하여 구분을 돕습니다.
              className="p-8 bg-white rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100 border border-gray-100 flex flex-col items-center"
            >
              {/* Icon Container with subtle gradient hover */}
              <div className="mb-5 p-5 rounded-full bg-gray-50 transition-all duration-300 hover:bg-gradient-to-br from-indigo-50 to-pink-50">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 tracking-wide">{card.title}</h3>
              <p className="text-gray-500 leading-relaxed text-center font-light">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
