-- ============================================
-- Supabase Storage 버킷 생성 (가장 간단한 버전)
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor 열기
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- 
-- 오류가 발생하면 각 단계를 하나씩 실행해보세요.
-- ============================================

-- 방법 1: 가장 기본적인 INSERT (권장)
-- 이 방법을 먼저 시도하세요
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- 방법 2: 위 방법이 실패하면 이 방법 시도 (파일 크기 제한 포함)
-- 방법 1이 성공했다면 이 단계는 건너뛰세요
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('posts', 'posts', true, 5242880)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- 방법 3: 모든 옵션 포함 (방법 1, 2가 성공했다면 이 단계는 건너뛰세요)
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

