# Supabase Realtime Chat 설정 가이드

이 프로젝트는 Supabase Realtime을 사용하여 실시간 채팅 기능을 제공합니다.

## 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가해야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase 키 찾기

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. Settings > API로 이동
4. 다음 키들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY` (서버 측에서만 사용)

## Supabase Realtime 활성화

Supabase Realtime을 사용하려면 다음 설정이 필요합니다:

### 1. Realtime 활성화

Supabase Dashboard에서:
1. Database > Replication으로 이동
2. `messages` 테이블의 Realtime을 활성화

또는 SQL Editor에서:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 2. Broadcast 채널 사용

현재 구현은 Supabase Realtime Broadcast를 사용합니다. 이는 별도의 테이블 설정 없이 실시간 메시지를 주고받을 수 있습니다.

## 주요 변경 사항

### Socket.IO에서 Supabase Realtime으로 전환

- **이전**: Socket.IO 서버 (`server.js`, `socket-server.js`)
- **현재**: Supabase Realtime Broadcast

### 장점

1. **Vercel 배포 지원**: WebSocket 연결이 필요 없어 Vercel에서도 작동
2. **서버리스**: 별도의 Socket.IO 서버 관리 불필요
3. **확장성**: Supabase가 인프라 관리
4. **실시간 동기화**: Supabase Realtime의 강력한 기능 활용

## 사용 방법

### 개발 모드

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm run start
```

## 참고 자료

- [Supabase Realtime Chat 문서](https://supabase.com/ui/docs/nextjs/realtime-chat)
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)

