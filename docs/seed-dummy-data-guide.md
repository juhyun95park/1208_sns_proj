# 더미 데이터 생성 가이드

홈 화면에 게시물을 표시하기 위한 더미 데이터 생성 방법입니다.

## 빠른 실행 방법

1. **Supabase Dashboard 접속**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 **SQL Editor** 클릭
   - **New query** 버튼 클릭

3. **SQL 파일 내용 복사**
   - 프로젝트의 `supabase/seed-dummy-data.sql` 파일 열기
   - 전체 내용 복사

4. **SQL 실행**
   - SQL Editor에 붙여넣기
   - **Run** 버튼 클릭 (또는 `Ctrl+Enter`)

5. **결과 확인**
   - 하단에 실행 결과가 표시됩니다
   - "게시물이 없습니다" 메시지가 사라지고 게시물이 표시됩니다

## 생성되는 데이터

- **더미 사용자**: 3명 (테스트 사용자 1, 2, 3)
- **더미 게시물**: 7개 (텍스트 이미지 포함)
- **더미 좋아요**: 일부 게시물에 좋아요 추가
- **더미 댓글**: 일부 게시물에 댓글 추가

## 문제 해결

### "게시물이 없습니다" 메시지가 계속 표시되는 경우

1. **데이터 확인**
   ```sql
   SELECT COUNT(*) FROM posts;
   SELECT COUNT(*) FROM users WHERE clerk_id LIKE 'dummy_%';
   ```

2. **post_stats 뷰 확인**
   ```sql
   SELECT * FROM post_stats LIMIT 1;
   ```
   뷰가 없으면 마이그레이션을 실행하세요.

3. **브라우저 콘솔 확인**
   - F12 → Console 탭
   - `PostFeed:`로 시작하는 로그 확인
   - 에러 메시지 확인

### API 에러가 발생하는 경우

1. **환경 변수 확인**
   - `.env` 파일에 Supabase URL과 Key가 올바르게 설정되어 있는지 확인

2. **네트워크 확인**
   - F12 → Network 탭
   - `/api/posts` 요청 확인
   - 응답 상태 코드 확인

## 추가 더미 데이터 생성

더 많은 게시물을 생성하려면 `seed-dummy-data.sql` 파일의 게시물 생성 부분을 복사하여 추가 실행하세요.

