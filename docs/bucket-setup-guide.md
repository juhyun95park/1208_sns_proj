# Supabase Storage 버킷 생성 가이드

## 문제: "Bucket not found" 오류

이 오류는 Supabase Storage에 `posts` 버킷이 생성되지 않았을 때 발생합니다.

## 해결 방법

### 방법 1: Supabase Dashboard UI 사용 (가장 간단)

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **Storage** 클릭
4. **"New bucket"** 버튼 클릭
5. 다음 정보 입력:
   - **Name**: `posts`
   - **Public bucket**: ✅ **체크** (게시물 이미지는 공개 접근 필요)
6. **"Create bucket"** 버튼 클릭

### 방법 2: SQL Editor 사용

1. Supabase Dashboard → **SQL Editor** 열기
2. 다음 SQL 중 하나를 선택하여 실행:

#### 옵션 A: 가장 간단한 방법 (권장)

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;
```

#### 옵션 B: 파일 크기 제한 포함

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('posts', 'posts', true, 5242880)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;
```

#### 옵션 C: 모든 설정 포함

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### 방법 3: 프로젝트 파일 사용

프로젝트에 포함된 SQL 파일을 사용:

1. `supabase/create-bucket-simple.sql` 파일 열기
2. 내용을 복사하여 Supabase SQL Editor에 붙여넣기
3. Run 버튼 클릭

## 버킷 생성 확인

버킷이 생성되었는지 확인:

```sql
SELECT * FROM storage.buckets WHERE id = 'posts';
```

또는 Supabase Dashboard → Storage 메뉴에서 `posts` 버킷이 보이는지 확인하세요.

## 환경 변수 설정 (선택사항)

`.env.local` 파일에 버킷 이름을 명시할 수 있습니다:

```bash
NEXT_PUBLIC_STORAGE_BUCKET=posts
```

이 변수가 설정되지 않으면 기본값 `posts`를 사용합니다.

## 문제 해결

### "permission denied" 오류
- Supabase 프로젝트의 Owner 또는 Admin 권한이 필요합니다.

### "duplicate key" 오류
- 버킷이 이미 존재합니다. 확인 쿼리로 확인하세요.

### 버킷은 생성되었지만 여전히 오류 발생
1. 브라우저 캐시 삭제
2. 개발 서버 재시작 (`pnpm dev`)
3. Supabase Dashboard에서 버킷이 Public인지 확인

## 다음 단계

버킷이 생성되면:
1. 게시물 작성 기능 테스트
2. 이미지 업로드 테스트
3. 업로드된 이미지가 정상적으로 표시되는지 확인

