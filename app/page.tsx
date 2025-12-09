/**
 * @file page.tsx
 * @description 루트 홈 피드 페이지
 *
 * Instagram 스타일 홈 피드:
 * - 게시물 목록 표시
 * - 무한 스크롤
 * - (main) 레이아웃 적용 (Sidebar, Header, BottomNav)
 *
 * @see docs/PRD.md - 홈 피드 섹션
 */

import { PostFeed } from '@/components/post/post-feed';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop/Tablet Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-[72px] lg:ml-[244px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        <div className="max-w-[630px] mx-auto px-4 py-4 md:py-8">
          <PostFeed />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

