'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const SCROLL_CONTENTS = [
  { 
    id: 1, 
    title: "AI의 색상 기반\n감정 분석", 
    subtitle: "색상 선택만으로도 당신의 감정을 깊이 이해하고 분석합니다.", 
    color: 'from-amber-400 via-orange-400 to-rose-400',
    accentColor: 'text-amber-500',
    dotColor: 'bg-amber-500'
  },
  { 
    id: 2, 
    title: "조용하지만\n명확한 알림", 
    subtitle: "중요한 메시지만 강조하고 불필요한 알림은 부드럽게 통합합니다.", 
    color: 'from-slate-800 via-slate-700 to-slate-600',
    accentColor: 'text-slate-700',
    dotColor: 'bg-slate-700'
  },
  { 
    id: 3, 
    title: "내면을 공유하는\n공간, Silk", 
    subtitle: "오직 나만을 위한 감정 기록부터 안전한 커뮤니티까지.", 
    color: 'from-indigo-500 via-purple-500 to-pink-500',
    accentColor: 'text-indigo-600',
    dotColor: 'bg-indigo-600'
  }
];

export default function Home() {
  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden bg-neutral-50">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-indigo-50/30 to-neutral-50"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-5xl relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-12"
          >
           
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 leading-[1.1] mb-8 tracking-tight">
              당신의 감정,
              <br />
              <span className="inline-block bg-gradient-to-r from-[#8877E6] via-[#788AE6] to-[#77ACE6] bg-clip-text text-transparent">
                Silk
              </span>
              <span className="text-neutral-900">로</span>
              <br />
              <span className="text-neutral-900">기록되다</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg sm:text-xl text-neutral-600 mb-14 font-light leading-relaxed max-w-2xl mx-auto"
          >
            소리와 형태로 감정을 표현하고 교감하는 감각적 미디어 아트 플랫폼
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => { location.hash = '#profile' }}   // ✅ 프로필 탭으로 이동
              className="group px-8 py-4 bg-neutral-900 text-white text-base font-medium rounded-full hover:bg-neutral-800 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-neutral-900/20 min-w-[200px]"
            >
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
                내 감정 기록하기 →
              </span>
            </button>

            <button
              onClick={() => { location.hash = '#explore' }}   // ✅ 탐색 탭으로 이동
              className="px-8 py-4 bg-white text-neutral-900 text-base font-medium rounded-full border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl min-w-[200px]"
            >
              다른 감정 탐색하기
            </button>
          </motion.div>
        </motion.div>

        {/* Subtle floating orbs */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 40, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 left-[10%] w-[400px] h-[400px] bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full blur-3xl"
        />
      </section>

      {/* Feature Sections */}
      <div className="relative bg-neutral-50">
        {SCROLL_CONTENTS.map((content, index) => (
          <section
            key={content.id}
            className="min-h-screen flex items-center justify-center px-6 py-20"
          >
            <div className="max-w-7xl w-full grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className={index % 2 === 0 ? 'md:order-1' : 'md:order-2'}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-2 h-2 rounded-full ${content.dotColor}`}></div>
                    <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                      Step {content.id}
                    </span>
                  </div>
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 leading-[1.1] mb-8 whitespace-pre-line tracking-tight">
                  {content.title}
                </h2>
                <p className="text-xl text-neutral-500 font-light leading-relaxed">
                  {content.subtitle}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.3 }}
                className={`flex justify-center ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}
              >
                <div className="relative">
                  <div className="w-[300px] h-[600px] bg-neutral-900 rounded-[48px] p-2 shadow-2xl shadow-neutral-900/30">
                    <div className={`w-full h-full bg-gradient-to-br ${content.color} rounded-[40px] flex items-center justify-center text-white overflow-hidden relative`}>
                      <div className="absolute inset-0 bg-white/5"></div>
                      <div className="relative z-10 text-center p-8">
                        <div className="text-7xl mb-6">
                          {index === 0 ? '⚡' : index === 1 ? '🔔' : '✨'}
                        </div>
                        <div className="text-lg font-medium opacity-90"></div>
                      </div>
                    </div>
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-neutral-900 rounded-full border-2 border-neutral-800"></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        ))}
      </div>

      {/* Core Features */}
      <section className="py-32 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6 px-4 py-2 bg-neutral-100 rounded-full">
              <span className="text-sm font-semibold text-neutral-600 tracking-wide">
                표현의 언어
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 tracking-tight">
              Silk의 표현 언어
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                title: "Sound", 
                desc: "내면의 울림을 멜로디와 주파수로 시각화하고 청각화합니다.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v18M6 17v-10M18 17v-10" />
                  </svg>
                ),
                gradient: "from-indigo-500 to-purple-500"
              },
              { 
                title: "Shape", 
                desc: "복잡한 감정 상태를 미니멀한 도형과 컬러 스펙트럼으로 표현합니다.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M12 18V6" />
                    <path d="M6 12h12" />
                  </svg>
                ),
                gradient: "from-pink-500 to-rose-500"
              },
              { 
                title: "Color", 
                desc: "감정의 미묘한 차이를 다채로운 색상 팔레트로 시각적으로 전달합니다.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5L12 2zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                ),
                gradient: "from-teal-500 to-cyan-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-neutral-50 rounded-3xl p-10 hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-500 cursor-pointer border border-neutral-200/50 group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-base text-neutral-600 leading-relaxed font-light">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}