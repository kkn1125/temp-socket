# 배포 가이드

## ⚠️ Vercel과 Socket.io 제한사항

Vercel은 **서버리스 환경**이므로 지속적인 연결이 필요한 Socket.io를 직접 지원하지 않습니다.

## 해결 방법

### 방법 1: Socket.io 서버를 별도로 실행 (권장)

1. **Railway 또는 Render에서 Socket.io 서버 실행**
   - `server.js`를 별도 서버에서 실행
   - 환경 변수 설정:
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `PORT` (자동 할당)

2. **Vercel에서 Next.js 앱 배포**
   - Socket.io 서버 URL을 환경 변수로 설정
   - `NEXT_PUBLIC_SOCKET_URL` = Socket.io 서버 URL

3. **클라이언트 설정**
   - `lib/socket.ts`가 자동으로 `NEXT_PUBLIC_SOCKET_URL` 또는 현재 도메인 사용

### 방법 2: Supabase Realtime 사용 (대안)

Socket.io 대신 Supabase Realtime을 사용하면 Vercel에서도 실시간 통신이 가능합니다.

## 현재 설정

- ✅ Socket.io 클라이언트: polling fallback 포함
- ✅ Socket.io 서버: 별도 서버에서 실행 필요
- ✅ Supabase: 데이터베이스로 사용

## 배포 체크리스트

### Vercel (Next.js 앱)
- [ ] Supabase 환경 변수 설정
- [ ] `NEXT_PUBLIC_SOCKET_URL` 설정 (Socket.io 서버 URL)

### 별도 서버 (Socket.io)
- [ ] `server.js` 실행
- [ ] Supabase 환경 변수 설정
- [ ] 포트 설정 (환경 변수 또는 자동)

