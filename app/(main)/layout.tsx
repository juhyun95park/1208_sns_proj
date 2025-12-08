/**
 * @file layout.tsx
 * @description (main) Route Group 레이아웃
 *
 * Instagram 스타일 메인 레이아웃:
 * - Desktop (1024px+): Sidebar (244px) + Main Feed (최대 630px)
 * - Tablet (768px-1024px): Icon-only Sidebar (72px) + Main Feed
 * - Mobile (<768px): Header + Main Feed + Bottom Nav
 *
 * @see docs/PRD.md - 레이아웃 구조 섹션
 */

import { Sidebar } from '@/components/layout/sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop/Tablet Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:ml-[72px] lg:ml-[244px] pt-[60px] md:pt-0 pb-[50px] md:pb-0">
        <div className="max-w-[630px] mx-auto px-4 py-4 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

