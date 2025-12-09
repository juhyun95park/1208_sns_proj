/**
 * @file sidebar.tsx
 * @description Instagram 스타일 Sidebar 컴포넌트
 *
 * Desktop/Tablet 반응형 Sidebar:
 * - Desktop (1024px+): 244px 너비, 아이콘 + 텍스트
 * - Tablet (768px-1024px): 72px 너비, 아이콘만
 * - Mobile (<768px): 숨김 (BottomNav로 대체)
 *
 * @see docs/PRD.md - 레이아웃 구조 섹션
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User } from 'lucide-react';
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
  { href: '/profile', icon: User, label: '프로필', requiresAuth: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:bg-white md:border-r md:border-[#dbdbdb] md:w-[72px] lg:w-[244px] z-10">
      <div className="flex flex-col h-full pt-8 pb-4 px-3 lg:px-4">
        {/* 로고/브랜드 (Desktop만 표시) */}
        <div className="hidden lg:block mb-8 px-2">
          <Link href="/" className="text-2xl font-bold text-[#262626]">
            Instagram
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isCreateButton = item.href === '#';

            const content = (
              <div
                className={`
                  flex items-center gap-4 px-3 py-2 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'font-semibold text-[#262626]'
                      : 'text-[#262626] hover:bg-[#fafafa]'
                  }
                `}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                <span className="hidden lg:inline text-base">
                  {item.label}
                </span>
              </div>
            );

            if (isCreateButton) {
              return (
                <SignedIn key={item.href}>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    {content}
                  </button>
                </SignedIn>
              );
            }

            if (item.requiresAuth) {
              return (
                <SignedIn key={item.href}>
                  <Link href={item.href} className="w-full">
                    {content}
                  </Link>
                </SignedIn>
              );
            }

            return (
              <Link key={item.href} href={item.href} className="w-full">
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </aside>
  );
}

