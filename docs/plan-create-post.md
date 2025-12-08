# 게시물 작성 기능 개발 계획

## 목표

PRD.md의 "2-1. 게시물 작성 모달" 및 "2-2. 게시물 작성 - 이미지 업로드" 섹션 요구사항 완료:
- CreatePostModal 컴포넌트 (Dialog)
- 이미지 미리보기 UI
- 텍스트 입력 필드 (캡션)
- Supabase Storage 이미지 업로드
- /api/posts POST API
- 파일 업로드 로직 및 검증

## 작업 항목

### 1. CreatePostModal 컴포넌트 생성

**파일**: `components/post/create-post-modal.tsx`

**구성 요소**:

**1. 모달 헤더**
- 제목: "새 게시물 만들기" 또는 "Create new post"
- 닫기 버튼 (X)
- 다음/게시 버튼 (이미지 선택 후 활성화)

**2. 이미지 선택 영역**
- 파일 선택 버튼 (또는 드래그 앤 드롭)
- 이미지 미리보기 (선택 후)
- 이미지 교체 버튼
- 이미지 제거 버튼

**3. 캡션 입력 영역**
- 텍스트 입력 필드 (Textarea)
- 최대 2,200자 제한
- 글자 수 표시 (예: "0/2,200")
- 플레이스홀더: "문구 입력..." 또는 "Write a caption..."

**4. 업로드 진행 상태**
- 로딩 인디케이터
- 진행률 표시 (선택사항)

**Props**:
```typescript
interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**상태 관리**:
- `selectedImage`: File | null
- `imagePreview`: string | null (URL.createObjectURL)
- `caption`: string
- `isUploading`: boolean
- `error`: string | null

### 2. 이미지 업로드 유틸리티 함수 생성

**파일**: `lib/utils/upload-image.ts`

**기능**:
- 파일 검증 (크기, 타입)
- Supabase Storage에 이미지 업로드
- 업로드된 이미지 URL 반환

**함수 시그니처**:
```typescript
export async function uploadPostImage(
  file: File,
  clerkUserId: string,
  supabase: SupabaseClient
): Promise<string>
```

**검증 규칙**:
- 파일 크기: 최대 5MB (5 * 1024 * 1024 bytes)
- 파일 타입: image/jpeg, image/png, image/webp, image/gif
- 파일명: `{clerkUserId}/{timestamp}.{ext}` 형식

**에러 처리**:
- 파일 크기 초과
- 지원하지 않는 파일 타입
- 업로드 실패

### 3. /api/posts POST API 생성

**파일**: `app/api/posts/route.ts` (기존 GET에 POST 추가)

**기능**:
- 게시물 생성
- Clerk 인증 필수
- 이미지 URL과 캡션 저장
- 현재 사용자의 user_id 확인

**요청 본문**:
```typescript
{
  image_url: string;  // Supabase Storage URL
  caption?: string;    // 최대 2,200자
}
```

**응답 형식**:
```typescript
{
  post: {
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
  };
}
```

**검증**:
- 인증 확인
- image_url 필수
- caption 최대 2,200자 (서버 사이드 검증)

### 4. Sidebar 및 BottomNav 통합

**파일**: `components/layout/sidebar.tsx`, `components/layout/bottom-nav.tsx`

**변경사항**:
- "만들기" 버튼 클릭 시 CreatePostModal 열기
- 모달 상태를 전역으로 관리하거나 각 컴포넌트에서 관리

**구현 옵션**:
- 옵션 1: 각 컴포넌트에서 모달 상태 관리
- 옵션 2: Context API로 전역 상태 관리 (권장)

### 5. PostFeed 업데이트

**파일**: `components/post/post-feed.tsx`

**변경사항**:
- 게시물 작성 성공 시 피드 새로고침
- 또는 새 게시물을 목록 맨 위에 추가

**구현 방법**:
- `onPostCreated` 콜백 prop 추가
- 또는 React Query/SWR 사용 (선택사항)

## 구현 세부사항

### 이미지 미리보기

**구현 방법**:
```typescript
const [imagePreview, setImagePreview] = useState<string | null>(null);

const handleFileSelect = (file: File) => {
  const previewUrl = URL.createObjectURL(file);
  setImagePreview(previewUrl);
  setSelectedImage(file);
};

// 컴포넌트 언마운트 시 URL 해제
useEffect(() => {
  return () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };
}, [imagePreview]);
```

### 파일 검증

**클라이언트 사이드 검증**:
```typescript
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '이미지 파일만 업로드 가능합니다.' };
  }

  return { valid: true };
}
```

### 업로드 플로우

**단계별 플로우**:
1. 사용자가 이미지 선택
2. 이미지 미리보기 표시
3. 캡션 입력 (선택사항)
4. "게시" 버튼 클릭
5. 이미지 파일 검증
6. Supabase Storage에 이미지 업로드
7. 업로드된 이미지 URL 받기
8. /api/posts POST로 게시물 생성
9. 성공 시 모달 닫기 및 피드 새로고침

### 에러 처리

**에러 시나리오**:
1. 파일 크기 초과: 사용자에게 알림
2. 지원하지 않는 파일 타입: 사용자에게 알림
3. 이미지 업로드 실패: 에러 메시지 표시
4. 게시물 생성 실패: 에러 메시지 표시 및 롤백 (이미지 삭제)

### UI/UX 개선

**드래그 앤 드롭** (선택사항):
- 이미지 선택 영역에 드래그 앤 드롭 지원
- `onDragOver`, `onDrop` 이벤트 처리

**이미지 편집** (선택사항):
- 이미지 크롭 기능
- 필터 적용 (1차 제외)

**캡션 입력 개선**:
- 자동 높이 조절 (Textarea)
- 해시태그 자동 완성 (선택사항, 1차 제외)
- 멘션 기능 (선택사항, 1차 제외)

## 파일 구조

```
components/
├── post/
│   ├── create-post-modal.tsx    # 게시물 작성 모달
│   ├── post-card.tsx
│   ├── post-card-skeleton.tsx
│   └── post-feed.tsx
lib/
├── utils/
│   ├── upload-image.ts          # 이미지 업로드 유틸리티
│   ├── format-time.ts
│   └── format-number.ts
app/
├── api/
│   └── posts/
│       └── route.ts             # GET (기존) + POST (추가)
```

## 타입 정의

**파일**: `types/post.ts` (기존 파일에 추가)

```typescript
export interface CreatePostRequest {
  image_url: string;
  caption?: string;
}

export interface CreatePostResponse {
  post: {
    id: string;
    user_id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
  };
}
```

## 검증 방법

1. 모달이 올바르게 열리고 닫히는지 확인
2. 이미지 선택 시 미리보기가 표시되는지 확인
3. 파일 크기 및 타입 검증이 작동하는지 확인
4. 이미지 업로드가 정상적으로 작동하는지 확인
5. 게시물 생성 후 피드에 반영되는지 확인
6. 에러 발생 시 적절한 메시지가 표시되는지 확인
7. 캡션 글자 수 제한이 작동하는지 확인

## 참고 파일

- `docs/PRD.md`: 게시물 작성 요구사항
- `docs/storage-setup.md`: Supabase Storage 설정 가이드
- `supabase/migrations/20251208142024_initial_sns_schema.sql`: posts 테이블 스키마
- `components/ui/dialog.tsx`: Dialog 컴포넌트
- `components/ui/textarea.tsx`: Textarea 컴포넌트
- `lib/supabase/clerk-client.ts`: Clerk 통합 Supabase 클라이언트

## 환경 변수 확인

**필수 환경 변수**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STORAGE_BUCKET` (기본값: "posts")

## Supabase Storage 설정

**사전 작업**:
1. Supabase Dashboard에서 Storage 버킷 생성 (`posts`)
2. RLS 정책 설정 (개발 단계에서는 비활성화 가능)
3. 파일 크기 제한 설정 (5MB)

자세한 내용은 `docs/storage-setup.md` 참고

## 완료 체크리스트

- [ ] CreatePostModal 컴포넌트 생성
- [ ] 이미지 선택 및 미리보기 기능
- [ ] 캡션 입력 필드 (2,200자 제한)
- [ ] 이미지 업로드 유틸리티 함수
- [ ] /api/posts POST API 구현
- [ ] Sidebar "만들기" 버튼 연결
- [ ] BottomNav "만들기" 버튼 연결
- [ ] 파일 검증 (크기, 타입)
- [ ] 에러 처리
- [ ] 업로드 진행 상태 표시
- [ ] 게시물 생성 후 피드 새로고침

