# Clerk + Supabase 통합 가이드

이 문서는 Clerk와 Supabase를 네이티브 통합하는 방법을 설명합니다. 2025년 4월 이후 권장되는 방식으로, JWT 템플릿 없이 Clerk를 Supabase의 third-party auth provider로 설정합니다.

## 목차

1. [Clerk Dashboard 설정](#1-clerk-dashboard-설정)
2. [Supabase Dashboard 설정](#2-supabase-dashboard-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [코드 사용법](#4-코드-사용법)
5. [RLS 정책 설정](#5-rls-정책-설정)
6. [테스트](#6-테스트)

## 1. Clerk Dashboard 설정

1. [Clerk Dashboard](https://dashboard.clerk.com)에 로그인합니다.
2. **Integrations** 메뉴로 이동하거나, 직접 [Supabase integration setup](https://dashboard.clerk.com/setup/supabase) 페이지로 이동합니다.
3. Supabase 통합을 활성화합니다:
   - 통합을 활성화하면 **Clerk domain**이 표시됩니다.
   - 이 **Clerk domain**을 복사해 둡니다 (예: `your-app.clerk.accounts.dev`).

> **참고**: 이 통합은 Clerk의 세션 토큰에 `"role": "authenticated"` 클레임을 자동으로 추가합니다. 이는 Supabase가 인증된 사용자로 인식하는 데 필요합니다.

## 2. Supabase Dashboard 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. **Authentication** > **Sign In / Up** > **Third Party Auth**로 이동합니다.
4. **Add provider**를 클릭하고 **Clerk**를 선택합니다.
5. Clerk Dashboard에서 복사한 **Clerk domain**을 입력합니다.
6. 저장합니다.

이제 Clerk의 세션 토큰이 Supabase에서 인증된 사용자로 인식됩니다.

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`.env.example` 파일을 참고하세요.

## 4. 코드 사용법

### Supabase 공식 방식 (Cookie-based Auth)

프로젝트는 Supabase 공식 Next.js 가이드를 따릅니다. 일반적인 Supabase 인증을 사용하는 경우:

#### Client Component에서 사용

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export default function MyComponent() {
  const supabase = createClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    return data;
  }

  return <div>...</div>;
}
```

#### Server Component에서 사용

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return (
    <div>
      {data?.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

### Clerk 통합 방식 (Third-party Auth)

Clerk를 사용하여 인증하는 경우:

#### Client Component에서 사용

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    return data;
  }

  return <div>...</div>;
}
```

#### Server Component에서 사용

```tsx
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return (
    <div>
      {data?.map((task) => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

#### Server Action에서 사용

```ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });
  
  if (error) {
    throw new Error('Failed to create task');
  }
  
  return data;
}
```

## 5. RLS 정책 설정

RLS(Row Level Security) 정책을 설정하여 사용자가 자신의 데이터에만 접근할 수 있도록 합니다.

### 예시: Tasks 테이블

```sql
-- 테이블 생성
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
TO authenticated
USING (auth.jwt()->>'sub' = user_id);

-- 사용자는 자신의 tasks만 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'sub' = user_id);

-- 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (auth.jwt()->>'sub' = user_id)
WITH CHECK (auth.jwt()->>'sub' = user_id);

-- 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON tasks
FOR DELETE
TO authenticated
USING (auth.jwt()->>'sub' = user_id);
```

### 중요 사항

- `auth.jwt()->>'sub'`는 Clerk의 사용자 ID를 반환합니다.
- `user_id` 컬럼은 `TEXT` 타입이어야 합니다 (Clerk ID는 문자열입니다).
- 개발 중에는 RLS를 비활성화할 수 있지만, 프로덕션에서는 반드시 활성화해야 합니다.

## 6. 테스트

1. 개발 서버를 실행합니다:
   ```bash
   pnpm dev
   ```

2. 애플리케이션에 로그인합니다.

3. 데이터를 생성하고 조회합니다.

4. 다른 사용자로 로그인하여 데이터가 분리되어 있는지 확인합니다.

5. Supabase Dashboard에서 테이블을 확인하여 각 사용자의 `user_id`가 올바르게 설정되었는지 확인합니다.

## 문제 해결

### "Unauthorized" 오류가 발생하는 경우

1. Clerk Dashboard에서 Supabase 통합이 활성화되었는지 확인합니다.
2. Supabase Dashboard에서 Clerk provider가 올바르게 설정되었는지 확인합니다.
3. 환경 변수가 올바르게 설정되었는지 확인합니다.
4. 브라우저 콘솔에서 네트워크 요청을 확인하여 토큰이 전달되는지 확인합니다.

### RLS 정책이 작동하지 않는 경우

1. RLS가 활성화되었는지 확인합니다:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. 정책이 올바르게 생성되었는지 확인합니다:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tasks';
   ```

3. `auth.jwt()->>'sub'`가 올바른 값을 반환하는지 확인합니다:
   ```sql
   SELECT auth.jwt()->>'sub';
   ```

## 참고 자료

- [Clerk Supabase 통합 공식 문서](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 문서](https://supabase.com/docs/guides/auth/third-party/overview)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)

