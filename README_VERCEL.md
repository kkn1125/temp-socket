# Vercel 배포 가이드

## ⚠️ 중요: Socket.io와 Vercel의 제한사항

Vercel은 **서버리스 환경**이므로 지속적인 연결이 필요한 Socket.io를 직접 지원하지 않습니다.

## 해결 방법

### 옵션 1: 별도 서버에서 Socket.io 실행 (권장)

1. **Railway, Render, 또는 다른 서버**에서 Socket.io 서버를 실행
2. `server.js`를 별도 서버에서 실행
3. 클라이언트에서 해당 서버 URL로 연결

**설정:**
- `.env.local`에 `NEXT_PUBLIC_SOCKET_URL` 추가
- 예: `NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app`

### 옵션 2: Vercel에서 Next.js만 배포

1. Vercel에 Next.js 앱만 배포 (Socket.io 서버 제외)
2. Socket.io 서버는 별도 서버에서 실행
3. 두 서버를 분리하여 운영

### 옵션 3: Socket.io 대신 Supabase Realtime 사용

Supabase Realtime을 사용하면 Vercel에서도 실시간 통신이 가능합니다.

## 현재 설정

- `vercel.json`: Next.js 앱 배포 설정
- `lib/socket.ts`: Socket.io 클라이언트 (polling fallback 포함)
- `server.js`: Socket.io 서버 (별도 서버에서 실행 필요)

## 배포 단계

1. **Vercel에 Next.js 앱 배포**
   ```bash
   vercel --prod
   ```

2. **별도 서버에서 Socket.io 서버 실행**
   - Railway, Render 등에서 `server.js` 실행
   - 또는 자체 서버에서 실행

3. **환경 변수 설정**
   - Vercel: Supabase 관련 환경 변수
   - Socket.io 서버: Supabase 관련 환경 변수
   - 클라이언트: `NEXT_PUBLIC_SOCKET_URL` 설정

