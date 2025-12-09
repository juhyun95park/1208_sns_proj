-- ============================================
-- Supabase Storage 버킷 생성 (간단 버전)
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor 열기
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- 
-- 오류가 발생하면 create-bucket-simple.sql 또는 
-- create-bucket-step-by-step.sql 파일을 사용하세요.
-- ============================================

-- 방법 1: 가장 기본적인 방법 (먼저 시도)
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- 방법 2: 설정 업데이트 (방법 1이 성공했다면 실행)
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'posts';

-- 버킷 생성 확인
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'posts';

