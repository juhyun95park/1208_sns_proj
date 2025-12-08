# Supabase Storage 버킷 설정 가이드

이 문서는 SNS 프로젝트에서 게시물 이미지를 저장하기 위한 Supabase Storage 버킷 설정 방법을 설명합니다.

## 목차

1. [버킷 생성](#1-버킷-생성)
2. [RLS 정책 설정](#2-rls-정책-설정)
3. [파일 업로드 제한](#3-파일-업로드-제한)
4. [코드에서 사용하기](#4-코드에서-사용하기)

## 1. 버킷 생성

### Supabase Dashboard에서 버킷 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 좌측 메뉴에서 **Storage**를 클릭합니다.
4. **"New bucket"** 버튼을 클릭합니다.
5. 다음 정보를 입력합니다:
   - **Name**: `posts` (또는 원하는 이름)
   - **Public bucket**: `false` (Private 권장)
     - Private: 인증된 사용자만 접근 가능
     - Public: 누구나 URL로 접근 가능
6. **"Create bucket"** 버튼을 클릭합니다.

### SQL로 버킷 생성 (선택사항)

Supabase SQL Editor에서 다음 명령을 실행할 수도 있습니다:

```sql
-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  false,  -- private bucket
  5242880,  -- 5MB 제한 (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']  -- 이미지 파일만 허용
)
ON CONFLICT (id) DO NOTHING;
```

## 2. RLS 정책 설정

Private 버킷을 사용하는 경우, RLS 정책을 설정하여 인증된 사용자만 자신의 파일에 접근할 수 있도록 해야 합니다.

### SQL Editor에서 RLS 정책 생성

Supabase Dashboard → **SQL Editor**에서 다음 SQL을 실행합니다:

```sql
-- INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- SELECT: 인증된 사용자만 자신의 파일 조회 가능
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- DELETE: 인증된 사용자만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);

-- UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
);
```

### Clerk 통합 시 주의사항

Clerk를 사용하는 경우, `auth.jwt()->>'sub'`는 Clerk의 사용자 ID를 반환합니다. 파일 경로는 다음과 같은 형식을 사용해야 합니다:

```
{clerk_user_id}/{filename}
```

예: `user_2abc123def456/image.jpg`

## 3. 파일 업로드 제한

### 파일 크기 제한

PRD에 따르면 최대 5MB까지 업로드 가능합니다. 버킷 설정에서 `file_size_limit`을 설정하거나, 애플리케이션 코드에서 검증할 수 있습니다.

### 파일 타입 제한

이미지 파일만 허용:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

애플리케이션 코드에서도 파일 타입을 검증해야 합니다.

## 4. 코드에서 사용하기

### 이미지 업로드 예시

```typescript
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@clerk/nextjs';

export async function uploadPostImage(file: File, clerkUserId: string) {
  const supabase = createClient();
  
  // 파일 검증
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }
  
  // 파일명 생성 (고유한 이름)
  const fileExt = file.name.split('.').pop();
  const fileName = `${clerkUserId}/${Date.now()}.${fileExt}`;
  
  // 업로드
  const { data, error } = await supabase.storage
    .from('posts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  // Public URL 가져오기 (Public 버킷인 경우)
  const { data: { publicUrl } } = supabase.storage
    .from('posts')
    .getPublicUrl(data.path);
  
  return publicUrl;
}
```

### 이미지 다운로드 예시

```typescript
import { createClient } from '@/lib/supabase/client';

export async function getImageUrl(filePath: string) {
  const supabase = createClient();
  
  // Public 버킷인 경우
  const { data: { publicUrl } } = supabase.storage
    .from('posts')
    .getPublicUrl(filePath);
  
  return publicUrl;
  
  // Private 버킷인 경우 (Signed URL)
  // const { data, error } = await supabase.storage
  //   .from('posts')
  //   .createSignedUrl(filePath, 3600); // 1시간 유효
  // 
  // if (error) throw error;
  // return data.signedUrl;
}
```

### 이미지 삭제 예시

```typescript
import { createClient } from '@/lib/supabase/client';

export async function deletePostImage(filePath: string) {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from('posts')
    .remove([filePath]);
  
  if (error) {
    throw error;
  }
}
```

## 환경 변수

`.env.local` 파일에 Storage 버킷 이름을 추가할 수 있습니다 (선택사항):

```bash
NEXT_PUBLIC_STORAGE_BUCKET=posts
```

## 문제 해결

### "new row violates row-level security policy" 오류

- RLS 정책이 올바르게 설정되었는지 확인
- 파일 경로가 `{clerk_user_id}/{filename}` 형식인지 확인
- Clerk 인증이 올바르게 설정되었는지 확인

### 파일 업로드 실패

- 파일 크기가 5MB를 초과하지 않는지 확인
- 파일 타입이 허용된 이미지 형식인지 확인
- 버킷 이름이 올바른지 확인

### 이미지가 표시되지 않음

- Public 버킷인 경우: URL이 올바른지 확인
- Private 버킷인 경우: Signed URL을 사용하고 있는지 확인
- CORS 설정이 올바른지 확인 (Supabase Dashboard → Settings → API)

## 참고 자료

- [Supabase Storage 문서](https://supabase.com/docs/guides/storage)
- [Supabase Storage RLS 가이드](https://supabase.com/docs/guides/storage/security/access-control)
- [프로젝트 PRD](./PRD.md)

