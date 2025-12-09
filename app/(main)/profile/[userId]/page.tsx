/**
 * @file page.tsx
 * @description 프로필 페이지 (동적 라우트)
 *
 * Instagram 스타일 프로필 페이지:
 * - 사용자 정보 및 통계 표시
 * - 게시물 그리드 표시
 * - 팔로우 기능
 *
 * @see docs/PRD.md - 프로필 페이지 섹션
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { ProfileHeader } from '@/components/profile/profile-header';
import { PostGrid } from '@/components/profile/post-grid';
import type { UserWithStats } from '@/types/user';

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

async function getUserData(userId: string): Promise<UserWithStats | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const { userId: currentClerkUserId } = await auth();

  // 사용자 정보 로드
  const user = await getUserData(userId);

  if (!user) {
    // 사용자를 찾을 수 없으면 홈으로 리다이렉트
    // Note: redirect()는 내부적으로 에러를 throw하지만, 이는 Next.js의 정상 동작입니다.
    redirect('/');
  }

  // 현재 사용자의 Supabase user_id 조회 (본인 프로필 확인용)
  let currentUserId: string | undefined;
  if (currentClerkUserId) {
    try {
      const supabase = createClerkSupabaseClient();
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', currentClerkUserId)
        .single();

      if (currentUser) {
        currentUserId = currentUser.id;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  return (
    <div className="w-full max-w-[935px] mx-auto px-4 py-8">
      <ProfileHeader
        userId={user.id}
        currentUserId={currentUserId}
        user={user}
      />
      <PostGrid userId={user.id} />
    </div>
  );
}

