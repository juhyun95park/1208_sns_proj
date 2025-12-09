/**
 * @file route.ts
 * @description 사용자 정보 및 통계 조회 API
 *
 * GET /api/users/[userId]
 * - user_stats 뷰를 활용하여 사용자 정보 및 통계 조회
 * - 게시물 수, 팔로워 수, 팔로잉 수 포함
 * - 현재 로그인한 사용자가 해당 사용자를 팔로우하는지 확인
 * - Clerk user ID (clerk_id) 또는 Supabase user ID (UUID)로 조회 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { UserResponse } from '@/types/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = createClerkSupabaseClient();

    console.group('사용자 정보 조회 API');
    console.log('요청된 userId:', userId);

    // userId가 UUID 형식인지 확인 (Supabase user ID)
    // UUID 형식: 8-4-4-4-12 (총 36자)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );

    let userStatsQuery;

    if (isUUID) {
      // Supabase user ID로 조회
      userStatsQuery = supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    } else {
      // Clerk user ID (clerk_id)로 조회
      userStatsQuery = supabase
        .from('user_stats')
        .select('*')
        .eq('clerk_id', userId)
        .single();
    }

    const { data: userStats, error: statsError } = await userStatsQuery;

    if (statsError || !userStats) {
      console.error('사용자 조회 에러:', statsError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('사용자 정보 조회 성공:', userStats.user_id);

    // 현재 로그인한 사용자가 해당 사용자를 팔로우하는지 확인
    let isFollowing = false;
    try {
      const { userId: currentClerkUserId } = await auth();
      if (currentClerkUserId) {
        // 현재 사용자의 Supabase user_id 조회
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', currentClerkUserId)
          .single();

        if (currentUser && currentUser.id !== userStats.user_id) {
          // 팔로우 관계 확인
          const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userStats.user_id)
            .single();

          isFollowing = !!follow;
        }
      }
    } catch (error) {
      // 인증되지 않은 경우 무시
      console.log('인증되지 않은 사용자, 팔로우 상태 확인 생략');
    }

    const userResponse: UserResponse = {
      user: {
        id: userStats.user_id,
        clerk_id: userStats.clerk_id,
        name: userStats.name,
        posts_count: Number(userStats.posts_count) || 0,
        followers_count: Number(userStats.followers_count) || 0,
        following_count: Number(userStats.following_count) || 0,
        is_following: isFollowing,
      },
    };

    console.log('응답 데이터:', userResponse);
    console.groupEnd();

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error in GET /api/users/[userId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

