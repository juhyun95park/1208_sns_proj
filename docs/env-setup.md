# 환경 변수 설정 가이드

이 문서는 SNS 프로젝트에 필요한 모든 환경 변수를 설명합니다.

## 필수 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# ============================================
# Clerk Authentication
# ============================================
# Clerk Dashboard → API Keys에서 가져오기
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs (선택사항)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# ============================================
# Supabase
# ============================================
# Supabase Dashboard → Settings → API에서 가져오기
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# 또는 (호환성을 위해)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (서버 사이드 전용, 절대 공개하지 마세요!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Supabase Storage
# ============================================
# 게시물 이미지를 저장할 버킷 이름
NEXT_PUBLIC_STORAGE_BUCKET=posts
```

## 환경 변수 가져오기

### Clerk API Keys

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인
2. **API Keys** 메뉴로 이동
3. 다음 키들을 복사:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### Supabase API Keys

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Settings** → **API** 메뉴로 이동
4. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** 키 → `SUPABASE_SERVICE_ROLE_KEY`

> **⚠️ 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 모든 RLS를 우회하는 관리자 권한이므로 절대 공개하지 마세요!

## Storage 버킷 이름

`NEXT_PUBLIC_STORAGE_BUCKET`은 Supabase Storage에서 생성한 버킷 이름과 일치해야 합니다.

기본값: `posts`

자세한 내용은 [Storage 설정 가이드](./storage-setup.md)를 참고하세요.

## 환경 변수 검증

개발 서버를 실행하기 전에 모든 환경 변수가 설정되었는지 확인하세요:

```bash
# 환경 변수 확인 (Windows PowerShell)
Get-Content .env.local

# 환경 변수 확인 (Linux/Mac)
cat .env.local
```

## 문제 해결

### "Supabase URL or Publishable Key is missing" 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
- 개발 서버를 재시작

### "Clerk Publishable Key is missing" 오류

- Clerk Dashboard에서 키를 올바르게 복사했는지 확인
- `.env.local` 파일에 키가 올바르게 입력되었는지 확인
- 따옴표 없이 입력했는지 확인

### 환경 변수가 적용되지 않음

- `.env.local` 파일을 저장했는지 확인
- 개발 서버를 완전히 종료하고 다시 시작
- 브라우저 캐시를 지우고 새로고침

## 참고 자료

- [Clerk 환경 변수 문서](https://clerk.com/docs/quickstarts/nextjs)
- [Supabase 환경 변수 문서](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

