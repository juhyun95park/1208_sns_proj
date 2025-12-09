/**
 * @file profile-header.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * Instagram 스타일 프로필 헤더:
 * - 프로필 이미지 (150px Desktop / 90px Mobile)
 * - 사용자명 (Bold)
 * - 통계 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 팔로우 버튼 또는 프로필 편집 버튼
 *
 * @see docs/PRD.md - 프로필 페이지 섹션
 */

'use client';

import { useState } from 'react';
import { FollowButton } from './follow-button';
import type { UserWithStats } from '@/types/user';

interface ProfileHeaderProps {
  userId: string;
  currentUserId?: string; // 현재 로그인한 사용자 ID (Supabase UUID)
  user: UserWithStats;
  onFollowChange?: (isFollowing: boolean) => void; // 팔로우 상태 변경 콜백
}

/**
 * 숫자를 포맷팅합니다 (예: 1234 → "1,234")
 */
function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export function ProfileHeader({
  userId,
  currentUserId,
  user,
  onFollowChange,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followersCount, setFollowersCount] = useState(user.followers_count);

  const isOwnProfile = currentUserId === userId;

  const handleFollowChange = (newIsFollowing: boolean) => {
    setIsFollowing(newIsFollowing);
    // 팔로워 수 업데이트
    setFollowersCount((prev) => (newIsFollowing ? prev + 1 : Math.max(0, prev - 1)));
    
    // 부모 컴포넌트에 알림
    if (onFollowChange) {
      onFollowChange(newIsFollowing);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop 레이아웃 */}
      <div className="hidden md:flex md:items-start md:gap-8 md:px-4 md:py-8">
        {/* 프로필 이미지 */}
        <div className="w-[150px] h-[150px] rounded-full bg-gradient-to-br from-[#0095f6] via-[#833ab4] to-[#fcb045] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-large ring-4 ring-white">
          <span className="text-4xl font-semibold text-white drop-shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 및 버튼 */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-light text-[#262626]">{user.name}</h1>
            {isOwnProfile ? (
              <button
                type="button"
                className="px-4 py-1.5 text-sm font-semibold border border-[#dbdbdb] rounded-lg text-[#262626] hover:bg-[#fafafa] hover:border-[#262626] transition-all duration-200 shadow-soft hover:shadow-medium"
              >
                프로필 편집
              </button>
            ) : (
              <FollowButton
                userId={userId}
                isFollowing={isFollowing}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(user.posts_count)}
              </span>{' '}
              <span className="text-[#262626]">게시물</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(followersCount)}
              </span>{' '}
              <span className="text-[#262626]">팔로워</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(user.following_count)}
              </span>{' '}
              <span className="text-[#262626]">팔로잉</span>
            </div>
          </div>

          {/* 사용자명 (바이오 영역) */}
          <div>
            <p className="font-semibold text-[#262626]">{user.name}</p>
            {/* 바이오는 1차 MVP 제외 */}
          </div>
        </div>
      </div>

      {/* Mobile 레이아웃 */}
      <div className="md:hidden px-4 py-4">
        {/* 프로필 이미지 및 사용자명 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-[90px] h-[90px] rounded-full bg-gradient-to-br from-[#0095f6] via-[#833ab4] to-[#fcb045] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-medium ring-2 ring-white">
            <span className="text-2xl font-semibold text-white drop-shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-light text-[#262626] mb-2">{user.name}</h1>
            {isOwnProfile ? (
              <button
                type="button"
                className="w-full px-4 py-1.5 text-sm font-semibold border border-[#dbdbdb] rounded-md text-[#262626] hover:bg-[#fafafa]"
              >
                프로필 편집
              </button>
            ) : (
              <FollowButton
                userId={userId}
                isFollowing={isFollowing}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>
        </div>

        {/* 통계 */}
        <div className="flex items-center justify-around border-t border-[#dbdbdb] pt-4">
          <div className="text-center">
            <div className="font-semibold text-[#262626]">
              {formatNumber(user.posts_count)}
            </div>
            <div className="text-xs text-[#262626]">게시물</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#262626]">
              {formatNumber(followersCount)}
            </div>
            <div className="text-xs text-[#262626]">팔로워</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-[#262626]">
              {formatNumber(user.following_count)}
            </div>
            <div className="text-xs text-[#262626]">팔로잉</div>
          </div>
        </div>

        {/* 사용자명 (바이오 영역) */}
        <div className="mt-4">
          <p className="font-semibold text-[#262626]">{user.name}</p>
          {/* 바이오는 1차 MVP 제외 */}
        </div>
      </div>
    </div>
  );
}

