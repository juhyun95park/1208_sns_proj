-- ============================================
-- Supabase Storage 버킷 생성 + RLS 정책 설정 (완전 버전)
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor 열기
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- ============================================

-- 1. posts 버킷 생성
DO $$
BEGIN
  -- 버킷이 존재하지 않으면 생성
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'posts') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'posts',
      'posts',
      true,  -- 공개 읽기 버킷 (게시물 이미지는 누구나 볼 수 있어야 함)
      5242880,  -- 5MB 제한 (5 * 1024 * 1024)
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- 이미지 파일만 허용
    );
    RAISE NOTICE '버킷 "posts" 생성 완료';
  ELSE
    RAISE NOTICE '버킷 "posts"가 이미 존재합니다.';
    -- 기존 버킷 설정 업데이트
    UPDATE storage.buckets
    SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    WHERE id = 'posts';
    RAISE NOTICE '버킷 "posts" 설정 업데이트 완료';
  END IF;
END $$;

-- 2. 기존 RLS 정책 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
DROP POLICY IF EXISTS "Public can read posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own posts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own posts" ON storage.objects;

-- 3. RLS 정책 생성

-- INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
-- 파일 경로 형식: {clerk_user_id}/{filename}
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- SELECT: 공개 읽기 (모든 사용자, 인증 불필요)
CREATE POLICY "Public can read posts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

-- DELETE: 인증된 사용자만 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
CREATE POLICY "Users can update own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
)
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- 4. 버킷 및 정책 확인
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'posts';

-- 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%posts%'
ORDER BY policyname;

