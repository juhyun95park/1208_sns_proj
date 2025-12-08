# 홈 피드 페이지 개발 계획

## 목표

PRD.md의 "1-3. 홈 피드 - 게시물 목록" 및 "1-4. 홈 피드 - 좋아요 기능" 섹션 요구사항 완료:
- PostCard 컴포넌트 (Header, Image, Actions, Content)
- PostCardSkeleton 로딩 UI
- PostFeed 컴포넌트
- /api/posts GET API (페이지네이션)
- /api/likes POST/DELETE API
- 좋아요 버튼 및 애니메이션 (하트 + 더블탭)

## 작업 항목

### 1. API Routes 생성

#### 1-1. /api/posts GET API

**파일**: `app/api/posts/route.ts`

**기능**:
- 게시물 목록 조회 (시간 역순 정렬)
- 페이지네이션 지원 (10개씩)
- post_stats 뷰를 사용하여 좋아요 수, 댓글 수 포함
- 사용자 정보 조인 (users 테이블)
- Clerk 인증 확인 (선택사항, 공개 피드인 경우)

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**응답 형식**:
```typescript
{
  posts: Array<{
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user: {
      id: string;
      clerk_id: string;
      name: string;
    };
    is_liked?: boolean; // 현재 사용자가 좋아요 했는지
  }>;
  hasMore: boolean;
  nextPage: number | null;
}
```

#### 1-2. /api/likes POST API

**파일**: `app/api/likes/route.ts`

**기능**:
- 게시물에 좋아요 추가
- 중복 좋아요 방지 (UNIQUE 제약 조건 활용)
- Clerk 인증 필수
- 현재 사용자의 user_id 확인 (users 테이블에서 clerk_id로 조회)

**요청 본문**:
```typescript
{
  post_id: string;
}
```

#### 1-3. /api/likes DELETE API

**파일**: `app/api/likes/route.ts` (동일 파일, DELETE 메서드)

**기능**:
- 게시물 좋아요 취소
- Clerk 인증 필수
- 본인의 좋아요만 삭제 가능

**요청 본문**:
```typescript
{
  post_id: string;
}
```

### 2. PostCard 컴포넌트 생성

**파일**: `components/post/post-card.tsx`

**구성 요소**:

**1. 헤더 (60px 높이)**
- 프로필 이미지: 32px 원형 (Clerk UserButton 또는 기본 아바타)
- 사용자명: Bold, 클릭 시 프로필 페이지로 이동
- 시간 표시: 상대 시간 (예: "3시간 전"), 작고 회색 텍스트
- ⋯ 메뉴: 우측, 드롭다운 (본인 게시물인 경우 삭제 옵션)

**2. 이미지 영역**
- 비율: 1:1 정사각형
- Next.js Image 컴포넌트 사용 (최적화)
- 더블탭 이벤트 처리 (모바일): 큰 하트 애니메이션 + 좋아요 토글
- 로딩 상태: Skeleton UI

**3. 액션 버튼 (48px 높이)**
- 좋아요 버튼: 빈 하트 ↔ 빨간 하트 (filled)
  - 클릭 애니메이션: scale(1.3) → scale(1)
  - 상태에 따라 Heart (outline) ↔ Heart (filled, 빨간색)
- 댓글 버튼: MessageCircle 아이콘 (클릭 시 댓글 입력창 포커스)
- 공유 버튼: Send 아이콘 (1차 제외, UI만)
- 북마크 버튼: Bookmark 아이콘 (1차 제외, UI만, 우측 정렬)

**4. 컨텐츠 영역**
- 좋아요 수: Bold, 숫자 포맷팅 (예: "1,234개")
- 캡션:
  - 사용자명 (Bold) + 내용
  - 2줄 초과 시 "... 더 보기" 버튼 (클릭 시 전체 표시)
- 댓글 미리보기:
  - "댓글 15개 모두 보기" 링크 (있는 경우)
  - 최신 2개 댓글만 표시
  - 각 댓글: 사용자명 (Bold) + 내용

**Props**:
```typescript
interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user: {
      id: string;
      clerk_id: string;
      name: string;
    };
    is_liked?: boolean;
  };
  comments?: Array<{
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}
```

### 3. PostCardSkeleton 컴포넌트 생성

**파일**: `components/post/post-card-skeleton.tsx`

**구성**:
- 헤더: 회색 원형 (프로필) + 회색 박스 (사용자명)
- 이미지: 정사각형 회색 박스 (Shimmer 효과)
- 액션 버튼: 작은 회색 박스들
- 컨텐츠: 여러 줄의 회색 박스

**Shimmer 효과**:
- CSS 애니메이션으로 좌우로 이동하는 그라데이션

### 4. PostFeed 컴포넌트 생성

**파일**: `components/post/post-feed.tsx`

**기능**:
- 게시물 목록 표시
- 무한 스크롤 구현 (Intersection Observer)
- 로딩 상태 관리 (Skeleton UI)
- 에러 처리

**구현 세부사항**:
- `useState`로 게시물 목록 및 로딩 상태 관리
- `useEffect`로 초기 데이터 로드
- Intersection Observer로 하단 감지
- 하단 도달 시 다음 페이지 로드 (10개씩)
- PostCardSkeleton을 로딩 중 표시

**Props**:
```typescript
interface PostFeedProps {
  initialPosts?: PostCardProps['post'][];
}
```

### 5. 유틸리티 함수 생성

#### 5-1. 시간 포맷팅 함수

**파일**: `lib/utils/format-time.ts`

**기능**:
- 상대 시간 표시 (예: "3시간 전", "2일 전", "1주 전")
- 1주 이상인 경우 날짜 표시 (예: "2024-12-08")

#### 5-2. 숫자 포맷팅 함수

**파일**: `lib/utils/format-number.ts`

**기능**:
- 좋아요 수 포맷팅 (예: 1234 → "1,234개")
- 큰 숫자 축약 (예: 10000 → "1만개", 선택사항)

### 6. 홈 페이지 업데이트

**파일**: `app/(main)/page.tsx`

**변경사항**:
- PostFeed 컴포넌트 사용
- Server Component로 초기 데이터 로드 (선택사항)
- 또는 Client Component로 완전히 클라이언트 사이드 렌더링

### 7. 댓글 미리보기 API (선택사항)

**파일**: `app/api/posts/[postId]/comments/route.ts`

**기능**:
- 특정 게시물의 최신 댓글 2개 조회
- PostCard에서 사용

또는 PostFeed에서 각 게시물의 댓글을 별도로 조회

## 구현 세부사항

### 데이터 페칭 전략

**옵션 1: Server Component + Client Component 하이브리드**
- Server Component에서 초기 데이터 로드
- Client Component에서 무한 스크롤 및 좋아요 처리

**옵션 2: 완전 Client Component**
- PostFeed를 Client Component로 구현
- useEffect로 초기 데이터 로드
- 무한 스크롤 및 좋아요는 클라이언트에서 처리

**권장**: 옵션 2 (더 간단하고 일관성 있음)

### 좋아요 상태 관리

- Optimistic Update 사용
- 클릭 시 즉시 UI 업데이트
- API 호출 실패 시 롤백

### 이미지 최적화

- Next.js Image 컴포넌트 사용
- `width`와 `height` 명시 (정사각형이므로 동일 값)
- `priority` 속성은 첫 번째 게시물에만 적용

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

### 타입 정의

**파일**: `types/post.ts` (새로 생성)

```typescript
export interface PostWithStats {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    id: string;
    clerk_id: string;
    name: string;
  };
  is_liked?: boolean;
}

export interface CommentWithUser {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}
```

## 검증 방법

1. 게시물 목록이 올바르게 표시되는지 확인
2. 무한 스크롤이 정상 작동하는지 확인
3. 좋아요 버튼 클릭 시 즉시 UI 업데이트되는지 확인
4. 좋아요 애니메이션이 올바르게 작동하는지 확인
5. 더블탭 좋아요가 모바일에서 작동하는지 확인
6. 댓글 미리보기가 최신 2개만 표시되는지 확인
7. 로딩 상태에서 Skeleton UI가 표시되는지 확인

## 참고 파일

- `docs/PRD.md`: PostCard 디자인 및 기능 요구사항
- `supabase/migrations/20251208142024_initial_sns_schema.sql`: 데이터베이스 스키마
- `types/database.types.ts`: TypeScript 타입 정의
- `lib/supabase/clerk-client.ts`: Clerk 통합 Supabase 클라이언트
- `lib/supabase/clerk-server.ts`: 서버 사이드 클라이언트

