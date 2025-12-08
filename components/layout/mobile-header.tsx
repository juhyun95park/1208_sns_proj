/**
 * @file mobile-header.tsx
 * @description Instagram 스타일 Mobile Header 컴포넌트
 *
 * Mobile 전용 (<768px):
 * - 높이: 60px 고정
 * - 좌측: 로고/브랜드명
 * - 우측: 알림, DM, 프로필 아이콘
 * - 고정 위치 (sticky top-0)
 *
 * @see docs/PRD.md - 레이아웃 구조 섹션
 */

'use client';

import Link from 'next/link';
import { Bell, Send, User } from 'lucide-react';
import { SignedIn, UserButton } from '@clerk/nextjs';

export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#dbdbdb] z-20">
      <div className="flex items-center justify-between h-full px-4">
        {/* 좌측: 로고 */}
        <Link href="/" className="text-xl font-bold text-[#262626]">
          Instagram
        </Link>

        {/* 우측: 아이콘들 */}
        <div className="flex items-center gap-4">
          <SignedIn>
            <button
              type="button"
              className="p-2 text-[#262626] hover:opacity-70 transition-opacity"
              aria-label="알림"
            >
              <Bell className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="p-2 text-[#262626] hover:opacity-70 transition-opacity"
              aria-label="메시지"
            >
              <Send className="w-6 h-6" />
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-6 h-6',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

