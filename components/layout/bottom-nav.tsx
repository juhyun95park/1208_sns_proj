/**
 * @file bottom-nav.tsx
 * @description Instagram 스타일 Bottom Navigation 컴포넌트
 *
 * Mobile 전용 (<768px):
 * - 높이: 50px 고정
 * - 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 * - 하단 고정 (fixed bottom-0)
 * - Active 상태 표시
 *
 * @see docs/PRD.md - 레이아웃 구조 섹션
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { CreatePostModal } from '@/components/post/create-post-modal';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: '홈', requiresAuth: false },
  { href: '/explore', icon: Search, label: '검색', requiresAuth: false },
  { href: '#', icon: PlusSquare, label: '만들기', requiresAuth: true },
  { href: '/activity', icon: Heart, label: '활동', requiresAuth: true },
  { href: '/profile', icon: User, label: '프로필', requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-20">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isCreateButton = item.href === '#';

          const content = (
            <div
              className={`
                flex flex-col items-center justify-center
                w-full h-full
                ${isActive ? 'text-[#262626]' : 'text-[#262626] opacity-60'}
              `}
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? 'stroke-[2.5]' : 'stroke-2'
                }`}
              />
            </div>
          );

          if (isCreateButton) {
            return (
              <SignedIn key={item.href}>
                <button
                  type="button"
                  className="flex-1 h-full"
                  onClick={() => setIsCreateModalOpen(true)}
                  aria-label={item.label}
                >
                  {content}
                </button>
              </SignedIn>
            );
          }

          if (item.requiresAuth) {
            return (
              <SignedIn key={item.href}>
                <Link href={item.href} className="flex-1 h-full">
                  {content}
                </Link>
              </SignedIn>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex-1 h-full">
              {content}
            </Link>
          );
        })}
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </nav>
  );
}

