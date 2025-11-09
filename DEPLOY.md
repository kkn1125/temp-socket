# 배포 가이드

## ⚠️ Vercel과 Socket.io 제한사항

Vercel은 **서버리스 환경**이므로 지속적인 연결이 필요한 Socket.io를 직접 지원하지 않습니다.

## 해결 방법

### 방법 1: Socket.io 서버를 별도로 실행 (권장)

#### 1단계: Railway 또는 Render에서 Socket.io 서버 실행

1. **Railway** (https://railway.app) 또는 **Render** (https://render.com)에 가입
2. 새 프로젝트 생성
3. GitHub 저장소 연결
4. 환경 변수 설정:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NODE_ENV=production
   PORT=자동 할당됨
   ```
5. 시작 명령어: `node server.js`
6. 배포 후 생성된 URL 확인 (예: `https://your-app.railway.app`)

#### 2단계: Vercel에서 Next.js 앱 배포

1. Vercel에 프로젝트 배포
2. 환경 변수 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
   ```
3. 배포 완료

#### 3단계: 확인

- Next.js 앱: Vercel에서 실행
- Socket.io 서버: Railway/Render에서 실행
- 데이터베이스: Supabase

### 방법 2: Supabase Realtime 사용 (대안)

Socket.io 대신 Supabase Realtime을 사용하면 Vercel에서도 실시간 통신이 가능합니다.

## 현재 설정 상태

✅ Socket.io 클라이언트: polling fallback 포함  
✅ Socket.io 서버: 별도 서버에서 실행 필요  
✅ Supabase: 데이터베이스로 사용  
✅ 환경 변수: 자동 감지 및 fallback 포함

## 빠른 시작

1. **Socket.io 서버 배포** (Railway/Render)
   ```bash
   # socket-server.js를 별도 서버에서 실행
   npm run start:socket
   # 또는
   node socket-server.js
   ```

2. **Next.js 앱 배포** (Vercel)
   ```bash
   vercel --prod
   ```

3. **환경 변수 설정**
   - Vercel: `NEXT_PUBLIC_SOCKET_URL` = Socket.io 서버 URL
   - Socket.io 서버: Supabase 환경 변수

## 문제 해결

### WebSocket 연결 실패
- `NEXT_PUBLIC_SOCKET_URL` 환경 변수가 올바르게 설정되었는지 확인
- Socket.io 서버가 실행 중인지 확인
- CORS 설정 확인

### 데이터베이스 연결 실패
- Supabase 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

