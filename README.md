# SILK MVP

해시 기반 탭(Feed / Write / Explore / History / Login) 구조의 대회용 MVP.

## 실행
```bash
npm i
cp .env.local.sample .env.local  # 값 채우기
npm run dev
```

## 기능 요약
- Firebase Auth(구글/익명)로 로그인, uid는 localStorage에 저장
- Write: 색/도형/소리 선택 → RTDB `emotions/{id}` 저장
- Feed: 최근 24시간 카드 그리드, 공감(❤), ⚡AI 분석 모달
- Explore: 목록형 미리보기 + ⚡AI, 지도는 추후 연결
- History: 내 카드 타임라인 + ⚡AI
- AI 결과는 `emotions/{id}/ai`에 캐시 저장

## 환경변수
`.env.local`에 Firebase 설정과 `NEXT_PUBLIC_AI_BASE` 지정.
