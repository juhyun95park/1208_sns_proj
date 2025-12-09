/**
 * @file route.ts
 * @description 사용자 검색 API
 *
 * GET /api/search?q={query}
 * - 사용자 이름으로 검색
 * - 부분 일치 검색 (ILIKE 사용)
 * - 검색 결과에 통계 정보 포함
 * - 현재 사용자의 팔로우 상태 확인
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { SearchResponse, UserWithStats } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json<SearchResponse>({ users: [] }, { status: 200 });
    }

    const supabase = createClerkSupabaseClient();
    const { userId: clerkUserId } = await auth();

    // 사용자 검색 (이름으로 부분 일치)
    const { data: users, error: usersError } = await supabase
      .from('user_stats')
      .select('*')
      .ilike('name', `%${query.trim()}%`)
      .limit(20); // 최대 20명

    if (usersError) {
      console.error('Error searching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    // 현재 사용자의 팔로우 상태 확인
    let followingMap: Record<string, boolean> = {};
    if (clerkUserId && users && users.length > 0) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (currentUser) {
        const userIds = users.map((u) => u.user_id);
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id)
          .in('following_id', userIds);

        if (follows) {
          follows.forEach((f) => {
            followingMap[f.following_id] = true;
          });
        }
      }
    }

    // 검색 결과 포맷팅
    const searchResults: UserWithStats[] = (users || []).map((user) => ({
      id: user.user_id,
      clerk_id: user.clerk_id,
      name: user.name,
      posts_count: user.posts_count || 0,
      followers_count: user.followers_count || 0,
      following_count: user.following_count || 0,
      is_following: followingMap[user.user_id] || false,
    }));

    return NextResponse.json<SearchResponse>({ users: searchResults });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

