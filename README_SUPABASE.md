# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL
   - API Keys (anon/public key와 service_role key)

## 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. 데이터베이스 스키마 생성

Supabase Dashboard의 SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 파일의 내용을 실행합니다.

또는 Supabase CLI를 사용하는 경우:

```bash
supabase db push
```

## 4. 테이블 구조

다음 테이블이 생성됩니다:
- `users` - 사용자 정보
- `rooms` - 채팅방 정보
- `participants` - 방 참여자 정보
- `messages` - 채팅 메시지

## 5. Row Level Security (RLS) 설정

Supabase는 기본적으로 RLS를 활성화합니다. 서버 사이드에서는 `service_role` 키를 사용하므로 RLS를 우회할 수 있습니다.

클라이언트 사이드에서 직접 접근이 필요한 경우, RLS 정책을 설정해야 합니다.

