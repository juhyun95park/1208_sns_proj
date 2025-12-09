-- ============================================
-- 더미 데이터 생성 SQL
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor 열기
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- ============================================

-- ============================================
-- 1단계: 더미 사용자 생성
-- ============================================
INSERT INTO users (clerk_id, name, created_at)
VALUES 
  ('dummy_user_1', '테스트 사용자 1', now() - interval '30 days'),
  ('dummy_user_2', '테스트 사용자 2', now() - interval '25 days'),
  ('dummy_user_3', '테스트 사용자 3', now() - interval '20 days')
ON CONFLICT (clerk_id) DO NOTHING;

-- ============================================
-- 2단계: 더미 게시물 생성 (텍스트 이미지 포함)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
BEGIN
  -- 더미 사용자 ID 가져오기
  SELECT id INTO user1_id FROM users WHERE clerk_id = 'dummy_user_1';
  SELECT id INTO user2_id FROM users WHERE clerk_id = 'dummy_user_2';
  SELECT id INTO user3_id FROM users WHERE clerk_id = 'dummy_user_3';
  
  -- 더미 게시물 생성 (각각 다른 안정적인 Unsplash 이미지 URL 사용)
  INSERT INTO posts (user_id, image_url, caption, created_at)
  VALUES
    -- 사용자 1의 게시물 (다양한 Unsplash 이미지)
    (user1_id, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop', '첫 번째 더미 게시물입니다! #테스트 #더미데이터 #인스타그램', now() - interval '2 days'),
    (user1_id, 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=800&fit=crop', '두 번째 더미 게시물입니다. 멋진 풍경이네요! 좋아요 눌러주세요!', now() - interval '1 day'),
    (user1_id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop', '세 번째 더미 게시물입니다. 오늘 날씨가 좋네요! #일상', now() - interval '12 hours'),
    (user1_id, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop', '네 번째 더미 게시물입니다. 댓글 남겨주세요!', now() - interval '8 hours'),
    
    -- 사용자 2의 게시물 (다른 Unsplash 이미지 ID 사용)
    (user2_id, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=800&fit=crop', '다섯 번째 더미 게시물입니다. #인스타그램 #클론 #SNS', now() - interval '5 hours'),
    (user2_id, 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=800&fit=crop', '여섯 번째 더미 게시물입니다. 테스트 중입니다!', now() - interval '3 hours'),
    (user2_id, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=800&fit=crop', '일곱 번째 더미 게시물입니다. 안녕하세요!', now() - interval '2 hours'),
    
    -- 사용자 3의 게시물 (또 다른 Unsplash 이미지 ID 사용)
    (user3_id, 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=800&fit=crop', '여덟 번째 더미 게시물입니다. 새 게시물이에요!', now() - interval '1 hour'),
    (user3_id, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=800&fit=crop', '아홉 번째 더미 게시물입니다. 최신 업데이트!', now() - interval '45 minutes'),
    (user3_id, 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=800&fit=crop', '열 번째 더미 게시물입니다. 이것 좀 보세요!', now() - interval '30 minutes'),
    (user3_id, 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=800&fit=crop', '열한 번째 더미 게시물입니다. 멋진 콘텐츠네요!', now() - interval '15 minutes');
END $$;

-- ============================================
-- 3단계: 더미 좋아요 생성 (선택사항)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  post_rec RECORD;
BEGIN
  SELECT id INTO user1_id FROM users WHERE clerk_id = 'dummy_user_1';
  SELECT id INTO user2_id FROM users WHERE clerk_id = 'dummy_user_2';
  SELECT id INTO user3_id FROM users WHERE clerk_id = 'dummy_user_3';
  
  -- 사용자 1이 모든 게시물에 좋아요
  FOR post_rec IN SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'dummy_%') LIMIT 8
  LOOP
    INSERT INTO likes (post_id, user_id)
    VALUES (post_rec.id, user1_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END LOOP;
  
  -- 사용자 2가 일부 게시물에 좋아요
  FOR post_rec IN SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'dummy_%') LIMIT 5
  LOOP
    INSERT INTO likes (post_id, user_id)
    VALUES (post_rec.id, user2_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END LOOP;
  
  -- 사용자 3이 일부 게시물에 좋아요
  FOR post_rec IN SELECT id FROM posts WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'dummy_%') LIMIT 3
  LOOP
    INSERT INTO likes (post_id, user_id)
    VALUES (post_rec.id, user3_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 4단계: 더미 댓글 생성 (선택사항)
-- ============================================
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  user3_id UUID;
  post_rec RECORD;
BEGIN
  SELECT id INTO user1_id FROM users WHERE clerk_id = 'dummy_user_1';
  SELECT id INTO user2_id FROM users WHERE clerk_id = 'dummy_user_2';
  SELECT id INTO user3_id FROM users WHERE clerk_id = 'dummy_user_3';
  
  -- 각 게시물에 댓글 추가 (더미 사용자의 게시물에만)
  FOR post_rec IN 
    SELECT p.id 
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE u.clerk_id LIKE 'dummy_%'
    ORDER BY p.created_at DESC
    LIMIT 5
  LOOP
    -- 사용자 1의 댓글
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES 
      (post_rec.id, user1_id, '멋진 게시물이네요! 👍', now() - interval '1 hour'),
      (post_rec.id, user1_id, '정말 좋아요!', now() - interval '30 minutes')
    ON CONFLICT DO NOTHING;
    
    -- 사용자 2의 댓글
    INSERT INTO comments (post_id, user_id, content, created_at)
    VALUES 
      (post_rec.id, user2_id, '완전 공감합니다!', now() - interval '15 minutes')
    ON CONFLICT DO NOTHING;
    
    -- 사용자 3의 댓글 (첫 번째 게시물에만)
    IF post_rec.id = (SELECT p.id FROM posts p JOIN users u ON p.user_id = u.id WHERE u.clerk_id LIKE 'dummy_%' ORDER BY p.created_at DESC LIMIT 1) THEN
      INSERT INTO comments (post_id, user_id, content, created_at)
      VALUES (post_rec.id, user3_id, '좋은 내용이네요!', now() - interval '10 minutes')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 5단계: 기존 더미 게시물 이미지 URL 업데이트 (이미 생성된 경우)
-- ============================================
-- 기존 더미 게시물의 이미지 URL을 새로운 안정적인 URL로 업데이트
UPDATE posts
SET image_url = CASE
  -- 사용자 1의 게시물
  WHEN caption LIKE '%첫 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop'
  WHEN caption LIKE '%두 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=800&fit=crop'
  WHEN caption LIKE '%세 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=800&fit=crop'
  WHEN caption LIKE '%네 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=800&fit=crop'
  -- 사용자 2의 게시물
  WHEN caption LIKE '%다섯 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=800&fit=crop'
  WHEN caption LIKE '%여섯 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=800&fit=crop'
  WHEN caption LIKE '%일곱 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=800&fit=crop'
  -- 사용자 3의 게시물
  WHEN caption LIKE '%여덟 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=800&fit=crop'
  WHEN caption LIKE '%아홉 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=800&fit=crop'
  WHEN caption LIKE '%열 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=800&fit=crop'
  WHEN caption LIKE '%열한 번째 더미 게시물%' THEN 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=800&fit=crop'
  ELSE image_url
END
WHERE user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'dummy_%')
  AND (caption LIKE '%더미 게시물%' OR caption LIKE '%첫 번째%' OR caption LIKE '%두 번째%' OR caption LIKE '%세 번째%' OR caption LIKE '%네 번째%' OR caption LIKE '%다섯 번째%' OR caption LIKE '%여섯 번째%' OR caption LIKE '%일곱 번째%' OR caption LIKE '%여덟 번째%' OR caption LIKE '%아홉 번째%' OR caption LIKE '%열 번째%' OR caption LIKE '%열한 번째%');

-- ============================================
-- 6단계: 데이터 확인
-- ============================================
-- 생성된 사용자 확인
SELECT id, clerk_id, name, created_at FROM users WHERE clerk_id LIKE 'dummy_%';

-- 생성된 게시물 확인
SELECT 
  p.id,
  u.name as user_name,
  p.caption,
  p.image_url,
  p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE u.clerk_id LIKE 'dummy_%'
ORDER BY p.created_at DESC;

-- 통계 확인
SELECT 
  COUNT(DISTINCT p.id) as total_posts,
  COUNT(DISTINCT l.id) as total_likes,
  COUNT(DISTINCT c.id) as total_comments
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.user_id IN (SELECT id FROM users WHERE clerk_id LIKE 'dummy_%');

