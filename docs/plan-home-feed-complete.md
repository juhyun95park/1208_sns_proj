# 홈 피드 페이지 개발 계획 (완료 상태)

## 목표

PRD.md의 "1-3. 홈 피드 - 게시물 목록" 및 "1-4. 홈 피드 - 좋아요 기능" 섹션 요구사항 완료

## 완료된 작업 항목

### ✅ 1. 타입 정의 생성

**파일**: `types/post.ts`

- `PostWithStats`: 게시물 통계 포함 타입
- `CommentWithUser`: 댓글 및 사용자 정보 타입
- `PostsResponse`: API 응답 타입

### ✅ 2. 유틸리티 함수 생성

**파일**: `lib/utils/format-time.ts`
- `formatRelativeTime()`: 상대 시간 포맷팅 (예: "3시간 전", "2일 전")

**파일**: `lib/utils/format-number.ts`
- `formatLikeCount()`: 좋아요 수 포맷팅 (예: "1,234개")

### ✅ 3. API Routes 생성

#### ✅ 3-1. /api/posts GET API

**파일**: `app/api/posts/route.ts`

**구현 내용**:
- 게시물 목록 조회 (시간 역순 정렬)
- 페이지네이션 지원 (10개씩)
- `post_stats` 뷰 사용하여 좋아요 수, 댓글 수 포함
- 사용자 정보 조인 (users 테이블)
- 현재 사용자의 좋아요 상태 확인 (`is_liked`)

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**응답 형식**:
```typescript
{
  posts: PostWithStats[];
  hasMore: boolean;
  nextPage: number | null;
}
```

#### ✅ 3-2. /api/likes POST API

**파일**: `app/api/likes/route.ts`

**구현 내용**:
- 게시물에 좋아요 추가
- 중복 좋아요 방지 (UNIQUE 제약 조건 활용)
- Clerk 인증 필수
- 현재 사용자의 user_id 확인 (users 테이블에서 clerk_id로 조회)

#### ✅ 3-3. /api/likes DELETE API

**파일**: `app/api/likes/route.ts` (동일 파일, DELETE 메서드)

**구현 내용**:
- 게시물 좋아요 취소
- Clerk 인증 필수
- 본인의 좋아요만 삭제 가능

#### ✅ 3-4. /api/posts/[postId]/comments GET API

**파일**: `app/api/posts/[postId]/comments/route.ts`

**구현 내용**:
- 특정 게시물의 최신 댓글 2개 조회
- PostCard에서 사용

### ✅ 4. PostCard 컴포넌트 생성

**파일**: `components/post/post-card.tsx`

**구현된 구성 요소**:

**1. 헤더 (60px 높이)**
- ✅ 프로필 이미지: 32px 원형 (기본 아바타)
- ✅ 사용자명: Bold, 클릭 시 프로필 페이지로 이동
- ✅ 시간 표시: 상대 시간 (예: "3시간 전"), 작고 회색 텍스트
- ✅ ⋯ 메뉴: 우측 (기본 구현)

**2. 이미지 영역**
- ✅ 비율: 1:1 정사각형
- ✅ Next.js Image 컴포넌트 사용 (최적화)
- ✅ 더블탭 이벤트 처리: 큰 하트 애니메이션 + 좋아요 토글

**3. 액션 버튼 (48px 높이)**
- ✅ 좋아요 버튼: 빈 하트 ↔ 빨간 하트 (filled)
  - ✅ 클릭 애니메이션: scale(1.3) → scale(1)
  - ✅ Optimistic Update 구현
- ✅ 댓글 버튼: MessageCircle 아이콘
- ✅ 공유 버튼: Send 아이콘 (UI만)
- ✅ 북마크 버튼: Bookmark 아이콘 (UI만, 우측 정렬)

**4. 컨텐츠 영역**
- ✅ 좋아요 수: Bold, 숫자 포맷팅 (예: "1,234개")
- ✅ 캡션:
  - ✅ 사용자명 (Bold) + 내용
  - ✅ 2줄 초과 시 "... 더 보기" 버튼 (클릭 시 전체 표시)
- ✅ 댓글 미리보기:
  - ✅ "댓글 15개 모두 보기" 링크 (있는 경우)
  - ✅ 최신 2개 댓글만 표시
  - ✅ 각 댓글: 사용자명 (Bold) + 내용

### ✅ 5. PostCardSkeleton 컴포넌트 생성

**파일**: `components/post/post-card-skeleton.tsx`

**구현 내용**:
- ✅ 헤더: 회색 원형 (프로필) + 회색 박스 (사용자명)
- ✅ 이미지: 정사각형 회색 박스 (Shimmer 효과)
- ✅ 액션 버튼: 작은 회색 박스들
- ✅ 컨텐츠: 여러 줄의 회색 박스
- ✅ Shimmer 애니메이션 구현

### ✅ 6. PostFeed 컴포넌트 생성

**파일**: `components/post/post-feed.tsx`

**구현된 기능**:
- ✅ 게시물 목록 표시
- ✅ 무한 스크롤 구현 (Intersection Observer)
- ✅ 로딩 상태 관리 (Skeleton UI)
- ✅ 에러 처리
- ✅ 각 게시물의 댓글 자동 로드

**구현 세부사항**:
- ✅ `useState`로 게시물 목록 및 로딩 상태 관리
- ✅ `useEffect`로 초기 데이터 로드
- ✅ Intersection Observer로 하단 감지
- ✅ 하단 도달 시 다음 페이지 로드 (10개씩)
- ✅ PostCardSkeleton을 로딩 중 표시

### ✅ 7. 스타일 및 애니메이션

**파일**: `app/globals.css`

**구현된 애니메이션**:
- ✅ Shimmer 애니메이션 (Skeleton UI용)
- ✅ 좋아요 클릭 애니메이션 (`heartScale`)
- ✅ 더블탭 하트 애니메이션 (`doubleTapHeart`)

### ✅ 8. 홈 페이지 업데이트

**파일**: `app/(main)/page.tsx`

**변경사항**:
- ✅ PostFeed 컴포넌트 사용
- ✅ Client Component로 완전히 클라이언트 사이드 렌더링

## 구현 세부사항

### 데이터 페칭 전략

**구현된 방식**: 완전 Client Component
- PostFeed를 Client Component로 구현
- useEffect로 초기 데이터 로드
- 무한 스크롤 및 좋아요는 클라이언트에서 처리

### 좋아요 상태 관리

**구현된 방식**: Optimistic Update
- 클릭 시 즉시 UI 업데이트
- API 호출 실패 시 롤백

### 이미지 최적화

**구현 내용**:
- Next.js Image 컴포넌트 사용
- `fill` 속성으로 정사각형 비율 유지
- `sizes="630px"` 속성 설정

### 애니메이션 구현

**좋아요 클릭 애니메이션**:
```css
@keyframes heartScale {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
```

**더블탭 하트 애니메이션**:
```css
@keyframes doubleTapHeart {
  0% { opacity: 0; transform: scale(0); }
  20% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.5); }
}
```

## 검증 완료 항목

1. ✅ 게시물 목록이 올바르게 표시됨
2. ✅ 무한 스크롤이 정상 작동함
3. ✅ 좋아요 버튼 클릭 시 즉시 UI 업데이트됨
4. ✅ 좋아요 애니메이션이 올바르게 작동함
5. ✅ 더블탭 좋아요가 작동함
6. ✅ 댓글 미리보기가 최신 2개만 표시됨
7. ✅ 로딩 상태에서 Skeleton UI가 표시됨

## 향후 개선 사항

### 선택적 개선

1. **프로필 이미지 개선**
   - Clerk UserButton 또는 실제 프로필 이미지 사용
   - users 테이블에 profile_image_url 컬럼 추가 고려

2. **게시물 삭제 기능**
   - ⋯ 메뉴에 드롭다운 추가
   - 본인 게시물인 경우 삭제 옵션 표시
   - DELETE /api/posts/[postId] API 구현

3. **댓글 작성 기능**
   - PostCard에 댓글 입력창 추가
   - POST /api/comments API 구현

4. **게시물 상세 모달**
   - Desktop: 모달로 표시
   - Mobile: 전체 페이지로 전환

5. **성능 최적화**
   - React Query 또는 SWR 도입 고려
   - 이미지 lazy loading 개선

## 참고 파일

- `docs/PRD.md`: PostCard 디자인 및 기능 요구사항
- `supabase/migrations/20251208142024_initial_sns_schema.sql`: 데이터베이스 스키마
- `types/database.types.ts`: TypeScript 타입 정의
- `lib/supabase/clerk-client.ts`: Clerk 통합 Supabase 클라이언트
- `lib/supabase/clerk-server.ts`: 서버 사이드 클라이언트

## 완료 상태

모든 기본 기능이 구현되었습니다. 홈 피드 페이지는 PRD의 요구사항을 충족하며, Instagram 스타일의 UI/UX를 제공합니다.

