/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일 홈 피드:
 * - 게시물 목록 표시
 * - 무한 스크롤
 *
 * @see docs/PRD.md - 홈 피드 섹션
 */

import { PostFeed } from '@/components/post/post-feed';

export default function HomePage() {
  return (
    <div className="w-full">
      <PostFeed />
    </div>
  );
}

