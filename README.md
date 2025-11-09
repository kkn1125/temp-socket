# Socket Chat Application

실시간 소켓 채팅 애플리케이션입니다.

## 기능

- ✅ 사용자 계정 관리 (닉네임 설정 및 수정)
- ✅ 채팅방 생성, 수정, 삭제 (비밀번호 설정 가능)
- ✅ 실시간 채팅 (Socket.io)
- ✅ 읽음/안읽음 메시지 관리
- ✅ 참여자 수 관리
- ✅ 다크 모드

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Node.js, Socket.io
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, Radix UI

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # 로컬 개발 시
```

### 3. Supabase 데이터베이스 설정

Supabase Dashboard의 SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 파일의 내용을 실행합니다.

### 4. 개발 서버 실행

#### 옵션 1: Next.js와 Socket.io 서버 동시 실행 (권장)

```bash
npm run dev
```

이 명령어는 Next.js (포트 3000)와 Socket.io 서버 (포트 3001)를 동시에 실행합니다.

#### 옵션 2: 각각 별도로 실행

```bash
# 터미널 1: Next.js 서버
npm run dev:next

# 터미널 2: Socket.io 서버
npm run dev:socket
```

## 프로덕션 배포

### Vercel에 Next.js 앱 배포

1. Vercel에 프로젝트 배포
2. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SOCKET_URL` (Socket.io 서버 URL)

### Railway/Render에 Socket.io 서버 배포

1. Railway 또는 Render에 새 프로젝트 생성
2. GitHub 저장소 연결
3. 환경 변수 설정:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NODE_ENV=production`
   - `PORT` (자동 할당)
   - `CORS_ORIGIN` (Vercel 도메인)
4. 시작 명령어: `npm run start:socket`
5. 배포 후 생성된 URL을 Vercel의 `NEXT_PUBLIC_SOCKET_URL`에 설정

## 스크립트

- `npm run dev` - Next.js와 Socket.io 서버 동시 실행
- `npm run dev:next` - Next.js 서버만 실행
- `npm run dev:socket` - Socket.io 서버만 실행
- `npm run build` - Next.js 앱 빌드
- `npm run start` - 프로덕션 Next.js 서버 실행
- `npm run start:socket` - 프로덕션 Socket.io 서버 실행
- `npm run start:all` - Next.js와 Socket.io 서버 동시 실행

## 프로젝트 구조

```
├── app/                    # Next.js 앱 라우트
│   ├── api/               # API 라우트
│   ├── chat/              # 채팅 페이지
│   └── rooms/             # 방 목록 페이지
├── components/            # React 컴포넌트
│   ├── chat/             # 채팅 관련 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── room/             # 방 관련 컴포넌트
├── contexts/              # React Context
├── lib/                   # 유틸리티 함수
│   ├── db.ts             # 데이터베이스 함수
│   ├── socket.ts         # Socket.io 클라이언트
│   └── supabase.ts       # Supabase 클라이언트
├── scripts/               # 데이터베이스 스크립트
├── socket-server.js       # Socket.io 서버 (별도 실행)
├── next-server.js         # Next.js 서버 (별도 실행)
└── server.js              # 통합 서버 (로컬 개발용)
```

## 주요 파일

- `socket-server.js` - Socket.io 서버 (별도 서버에서 실행)
- `next-server.js` - Next.js 서버 (Vercel 배포 시 사용)
- `lib/db.ts` - Supabase 데이터베이스 함수
- `lib/socket.ts` - Socket.io 클라이언트

## 문제 해결

### Socket.io 연결 실패

- `NEXT_PUBLIC_SOCKET_URL` 환경 변수가 올바르게 설정되었는지 확인
- Socket.io 서버가 실행 중인지 확인
- CORS 설정 확인

### 데이터베이스 연결 실패

- Supabase 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 데이터베이스 스키마가 올바르게 생성되었는지 확인
