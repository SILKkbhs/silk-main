'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface MainButton {
    href: string;
    label: string;
    style: string;
}

interface CoreElement {
    title: string;
    description: string;
    icon: React.ReactNode;
}

interface ScrollContent {
    id: number;
    title: string;
    subtitle: string;
    color: string;
    imgPlaceholder: string;
}

interface TextScrollItemProps {
    content: ScrollContent;
    setActiveScreenId: (id: number) => void;
    isActive: boolean;
}

interface MobileMockupProps {
    activeScreenId: number;
}


const mainButtons: MainButton[] = [
  { 
    href: '#write', 
    label: '내 감정 기록하기', 
    style: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-indigo-400/50' 
  },
  { 
    href: '#explore', 
    label: '다른 감정 탐색하기', 
    style: 'bg-transparent text-indigo-600 border border-indigo-200 hover:bg-indigo-50' 
  },
];

const coreElements: CoreElement[] = [
  { 
    title: "Sound", 
    description: "내면의 울림을 멜로디와 주파수로 시각화하고 청각화합니다.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M6 17v-10M18 17v-10" />
      </svg>
    )
  },
  { 
    title: "Shape", 
    description: "복잡한 감정 상태를 미니멀한 도형과 컬러 스펙트럼으로 표현합니다.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M12 18V6" />
        <path d="M6 12h12" />
      </svg>
    )
  },
  { 
    title: "Emotion", 
    description: "안전하고 사려 깊은 커뮤니티에서 진실된 감정을 공유하고 공감합니다.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5L12 2zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    )
  },
];

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3, },
  },
};

const cardAnimation: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } 
  },
};

const SCROLL_CONTENTS: ScrollContent[] = [
  { id: 1, title: "300% 더 빨라진 반응 속도", subtitle: "메시지를 보내고 받는 경험이 압도적으로 매끄러워졌습니다. 이제 지연 없이 소통하세요.", color: 'bg-yellow-400', imgPlaceholder: "1. 채팅 목록 화면 이미지" },
  { id: 2, title: "조용하지만 명확한 알림", subtitle: "중요한 메시지만 강조하고, 불필요한 알림은 부드럽게 통합하여 집중력을 높입니다.", color: 'bg-gray-700', imgPlaceholder: "2. 알림 통합 화면 이미지" },
  { id: 3, title: "내면을 공유하는 공간, Silk", subtitle: "오직 나만을 위한 감정 기록부터 안전한 커뮤니티 공유까지, 하나의 앱에서 경험하세요.", color: 'bg-indigo-600', imgPlaceholder: "3. 감정 기록 화면 이미지" }
];


const TextScrollItem = ({ content, setActiveScreenId, isActive }: TextScrollItemProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.5, once: false });

  useEffect(() => {
    if (isInView) {
      setActiveScreenId(content.id);
    }
  }, [isInView, content.id, setActiveScreenId]);

  return (
    // h-[90vh] 대신 h-screen을 사용하여 스냅 정확도 개선
    <div ref={ref} className="h-screen flex flex-col justify-center px-4 sm:px-6 scroll-snap-align-center"> 
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: isActive ? 1 : 0.4,
          y: isActive ? 0 : 0, 
          scale: isActive ? 1 : 0.95
        }}
        // 전환 시간을 0.5s에서 0.8s로 늘려 더 천천히 바뀌도록 조정
        transition={{ duration: 0.8 }} 
        className="max-w-md mx-auto lg:mx-0 text-left"
      >
        <h3 className={`text-sm font-semibold mb-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
          STEP 0{content.id}
        </h3>
        <h2 className={`text-4xl font-bold mb-4 transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
          {content.title}
        </h2>
        <p className={`text-lg transition-colors ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
          {content.subtitle}
        </p>
      </motion.div>
    </div>
  );
};

const MobileMockup = ({ activeScreenId }: MobileMockupProps) => {
  return (
    <motion.div 
      className="w-[300px] h-[600px] bg-gray-900 rounded-[32px] shadow-2xl p-2.5 relative flex justify-center items-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="w-full h-full bg-white rounded-[24px] overflow-hidden relative">
        
        {SCROLL_CONTENTS.map((content) => (
          <motion.div
            key={content.id}
            className="absolute top-0 left-0 w-full h-full flex justify-center items-center rounded-[24px] text-white font-bold text-center p-8"
            initial={false}
            animate={{ 
              opacity: content.id === activeScreenId ? 1 : 0, 
              y: content.id === activeScreenId ? 0 : 20, 
              backgroundColor: content.id === activeScreenId ? content.color : 'transparent' 
            }}
            // 목업 전환 시간을 0.6s에서 0.8s로 늘려 더 천천히 바뀌도록 조정
            transition={{ duration: 0.8 }} 
          >
            {content.imgPlaceholder}
          </motion.div>
        ))}

      </div>
      <div className="absolute top-3.5 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-gray-700 rounded-full"></div>
    </motion.div>
  );
};

export default function Home() {
  const [activeScreenId, setActiveScreenId] = useState<number>(1);
  
  return (
    <div className="flex flex-col items-center text-center w-full bg-white min-h-screen">
      
      <motion.section 
        className="py-20 md:py-36 max-w-5xl px-4 sm:px-6 w-full"
        initial="hidden"
        animate="visible"
        variants={staggerContainer} 
      > 
        <motion.h1 
          className="text-5xl sm:text-7xl md:text-8xl font-light text-gray-900 mb-6 leading-tight tracking-tight"
          variants={fadeIn} 
        >
          당신의 감정,
          <br />
          <motion.span 
            className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500 inline-block"
            variants={fadeIn}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Silk로 기록되다.
          </motion.span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-500 mb-12 font-light max-w-2xl mx-auto"
          variants={fadeIn} 
          transition={{ delay: 0.3, duration: 0.6 }} 
        >
          말이 아닌 소리와 형태로, 당신의 가장 순수한 내면을 섬세하게 표현하고 교류하는
          <br className="hidden sm:inline" />
          **감각적인 미디어 플랫폼**입니다.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4"
          variants={fadeIn} 
          transition={{ delay: 0.5, duration: 0.6 }} 
        >
          {mainButtons.map((button) => (
            <a
              key={button.href}
              href={button.href}
              className={`py-3 px-10 rounded-full text-base font-medium transition duration-300 transform hover:scale-[1.05] whitespace-nowrap shadow-lg ${button.style}`}
            >
              {button.label}
            </a>
          ))}
        </motion.div>
      </motion.section>

      <div className="relative w-full bg-white border-y border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[300vh]">
          
          {/* 스크롤 컨테이너: scroll-snap-type-y-mandatory 및 scroll-smooth 적용 */}
          <div className="lg:w-1/2 w-full order-2 lg:order-1 pt-0 
                        overflow-y-scroll lg:overflow-y-auto 
                        scroll-snap-type-y-mandatory scroll-smooth lg:h-[300vh] h-[300vh]"> 
            {SCROLL_CONTENTS.map((content) => (
              <TextScrollItem 
                key={content.id} 
                content={content} 
                setActiveScreenId={setActiveScreenId} 
                isActive={activeScreenId === content.id}
              />
            ))}
            {/* 마지막 요소 뒤에 더미 공간 제거 */}
          </div>

          <div className="lg:w-1/2 w-full order-1 lg:order-2 lg:flex justify-center items-center py-12 lg:py-0 
                        lg:sticky lg:top-0 lg:h-screen transition-all duration-300">
            <MobileMockup activeScreenId={activeScreenId} />
          </div>
        </div>
      </div>

      <section className="w-full pt-16 pb-20 bg-gray-50 border-t border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-800 mb-12">
          Silk의 표현 언어
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-6 sm:px-8">
          {coreElements.map((card, index) => (
            <motion.div 
              key={index} 
              className="p-8 bg-white rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100 border border-gray-100 flex flex-col items-center text-center"
              variants={cardAnimation}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="mb-5 p-5 rounded-full bg-gray-100 transition-all duration-300 hover:bg-indigo-50">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 tracking-wide">{card.title}</h3>
              <p className="text-gray-500 leading-relaxed text-center font-light">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section 
        className="w-full py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.8 }}
      >
      </motion.section>

    </div>
  );
}