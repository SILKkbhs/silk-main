
# SILK Next.js Starter (Hash Tabs + Firebase v9)
이 폴더들을 **create-next-app**으로 만든 프로젝트 루트에 그대로 덮어넣으면 됩니다.

## 1) .env.local 만들기
`.env.example`를 복사해서 `.env.local`로 만들고 값을 채워주세요.
`.env.local`은 커밋 금지! (`.gitignore`에 .env* 포함)

## 2) 폴더 복사
- `src/` → 프로젝트 루트에 병합
- `public/` → 프로젝트 루트에 병합
- (선택) `.prettierrc`, `eslint.config.mjs` → 프로젝트에 없으면 추가

## 3) 개발 서버
```bash
npm install
npm run dev
```
http://localhost:3000 에서 확인

## 4) 구조
- 해시 기반 탭: #feed / #write / #explore
- Firebase v9 모듈 import
- 컴포넌트: TabBar, Feed, Write, Explore (기본 동작 및 TODO 주석)
