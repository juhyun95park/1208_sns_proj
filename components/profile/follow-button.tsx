/**
 * @file follow-button.tsx
 * @description 팔로우/언팔로우 버튼 컴포넌트
 *
 * Instagram 스타일 팔로우 버튼:
 * - 미팔로우: "팔로우" 버튼 (파란색 배경, #0095f6)
 * - 팔로우 중: "팔로잉" 버튼 (회색 배경, #262626)
 * - Hover 시: "언팔로우" 텍스트 표시 (빨간 테두리, #ed4956)
 * - Optimistic Update 적용
 *
 * @see docs/PRD.md - 팔로우 기능 섹션
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string; // 팔로우할 사용자 ID (Supabase UUID)
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  disabled?: boolean;
}

export function FollowButton({
  userId,
  isFollowing,
  onFollowChange,
  disabled = false,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleToggleFollow = async () => {
    if (isLoading || disabled) return;

    // Optimistic Update
    const previousState = isFollowing;
    onFollowChange(!previousState);
    setIsLoading(true);

    try {
      if (previousState) {
        // 언팔로우
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            following_id: userId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to unfollow');
        }
      } else {
        // 팔로우
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            following_id: userId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to follow');
        }
      }
    } catch (error) {
      // 롤백
      onFollowChange(previousState);
      console.error('Error toggling follow:', error);
      // 에러 메시지는 상위 컴포넌트에서 처리하거나 토스트로 표시 가능
    } finally {
      setIsLoading(false);
    }
  };

  // 팔로우 중이고 호버 중일 때 "언팔로우" 표시
  const buttonText = isFollowing
    ? isHovering
      ? '언팔로우'
      : '팔로잉'
    : '팔로우';

  // 버튼 스타일 결정
  const getButtonStyles = () => {
    if (isFollowing) {
      if (isHovering) {
        // 호버 시 빨간 테두리
        return 'bg-white text-[#ed4956] border-2 border-[#ed4956] hover:bg-[#ed4956]/5 shadow-soft hover:shadow-medium';
      }
      // 팔로우 중: 회색 배경
      return 'bg-[#262626] text-white hover:bg-[#262626]/90 shadow-soft hover:shadow-medium';
    }
    // 미팔로우: 파란색 그라데이션 배경
    return 'bg-gradient-to-r from-[#0095f6] to-[#0084d4] text-white hover:from-[#0084d4] hover:to-[#0073c2] shadow-soft hover:shadow-medium';
  };

  return (
    <Button
      type="button"
      onClick={handleToggleFollow}
      disabled={isLoading || disabled}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${getButtonStyles()}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="sr-only">처리 중...</span>
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}

