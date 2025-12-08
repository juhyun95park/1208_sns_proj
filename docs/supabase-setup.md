# Supabase 설정 가이드

이 문서는 Supabase 공식 Next.js 가이드를 따라 프로젝트에 Supabase를 연결하는 방법을 설명합니다.

## 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [데이터베이스 테이블 생성](#3-데이터베이스-테이블-생성)
4. [코드 사용법](#4-코드-사용법)
5. [테스트](#5-테스트)

## 1. Supabase 프로젝트 생성

1. [database.new](https://database.new)에 접속하여 새 Supabase 프로젝트를 생성합니다.
2. 또는 [Supabase Dashboard](https://supabase.com/dashboard)에서 **New Project**를 클릭합니다.
3. 프로젝트 정보를 입력하고 생성합니다.

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# 또는 (호환성을 위해)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (서버 사이드 전용, 절대 공개하지 마세요!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 환경 변수 가져오기

1. Supabase Dashboard → **Settings** → **API**
2. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** 키 → `SUPABASE_SERVICE_ROLE_KEY`

## 3. 데이터베이스 테이블 생성

### 방법 1: Supabase Dashboard 사용

1. Supabase Dashboard → **Table Editor**
2. **New Table** 클릭
3. 테이블 이름과 컬럼을 추가합니다.

### 방법 2: SQL Editor 사용

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 실행합니다:

```sql
-- 예시: instruments 테이블 생성
CREATE TABLE instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- 샘플 데이터 삽입
INSERT INTO instruments (name)
VALUES
  ('violin'),
  ('viola'),
  ('cello');

-- RLS 활성화
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 추가 (예시)
CREATE POLICY "public can read instruments"
ON public.instruments
FOR SELECT
TO anon
USING (true);
```

## 4. 코드 사용법

### Server Component에서 사용

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('instruments')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return (
    <div>
      {data?.map((instrument) => (
        <div key={instrument.id}>{instrument.name}</div>
      ))}
    </div>
  );
}
```

### Client Component에서 사용

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const supabase = createClient();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('instruments')
        .select('*');
      
      if (error) {
        console.error('Error:', error);
        return;
      }
      
      setData(data || []);
    }
    
    fetchData();
  }, [supabase]);

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Server Action에서 사용

```ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function createInstrument(name: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('instruments')
    .insert({ name });
  
  if (error) {
    throw new Error('Failed to create instrument');
  }
  
  return data;
}
```

## 5. 테스트

### 예시 페이지 확인

프로젝트에 포함된 예시 페이지를 확인하세요:

1. 개발 서버 실행:
   ```bash
   pnpm dev
   ```

2. 브라우저에서 `/instruments` 페이지 접속

3. 데이터가 올바르게 표시되는지 확인

### 직접 테스트

1. Supabase Dashboard → **Table Editor**에서 데이터 추가
2. 페이지를 새로고침하여 변경사항 확인
3. 브라우저 개발자 도구에서 네트워크 요청 확인

## 문제 해결

### "Supabase URL or Publishable Key is missing" 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
- 개발 서버를 재시작

### 데이터가 표시되지 않는 경우

1. RLS 정책 확인:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'instruments';
   ```

2. 테이블에 데이터가 있는지 확인:
   ```sql
   SELECT * FROM instruments;
   ```

3. 브라우저 콘솔에서 오류 확인

### CORS 오류

- Supabase Dashboard → **Settings** → **API** → **CORS** 설정 확인
- 로컬 개발 환경(`http://localhost:3000`)이 허용되어 있는지 확인

## 참고 자료

- [Supabase 공식 Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR 문서](https://supabase.com/docs/guides/auth/server-side)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

