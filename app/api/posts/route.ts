/**
 * @file route.ts
 * @description 게시물 목록 조회 API
 *
 * GET /api/posts
 * - 페이지네이션 지원
 * - 시간 역순 정렬
 * - 좋아요 수, 댓글 수 포함
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { PostsResponse } from '@/types/post';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const supabase = createClerkSupabaseClient();

    // post_stats 뷰에서 게시물 목록 조회 (좋아요 수, 댓글 수 포함)
    const { data: postStats, error: statsError } = await supabase
      .from('post_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statsError) {
      console.error('Error fetching post stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }

    if (!postStats || postStats.length === 0) {
      return NextResponse.json<PostsResponse>({
        posts: [],
        hasMore: false,
        nextPage: null,
      });
    }

    // 각 게시물의 사용자 정보 조회
    const userIds = [...new Set(postStats.map((p) => p.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_id, name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 현재 사용자가 좋아요한 게시물 확인 (인증된 경우)
    let likedPostIds: string[] = [];
    try {
      const { userId } = await auth();
      if (userId) {
        // users 테이블에서 현재 사용자의 user_id 조회
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single();

        if (currentUser) {
          const postIds = postStats.map((p) => p.post_id);
          const { data: likes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', currentUser.id)
            .in('post_id', postIds);

          likedPostIds = likes?.map((l) => l.post_id) || [];
        }
      }
    } catch (error) {
      // 인증되지 않은 경우 무시
      console.log('User not authenticated, skipping like status check');
    }

    // 사용자 정보를 맵으로 변환
    const userMap = new Map(
      users?.map((u) => [u.id, u]) || []
    );

    // 게시물 데이터 구성
    const posts = postStats.map((stat) => {
      const user = userMap.get(stat.user_id);
      return {
        id: stat.post_id,
        user_id: stat.user_id,
        image_url: stat.image_url,
        caption: stat.caption,
        created_at: stat.created_at,
        likes_count: stat.likes_count,
        comments_count: stat.comments_count,
        user: user || {
          id: stat.user_id,
          clerk_id: '',
          name: 'Unknown',
        },
        is_liked: likedPostIds.includes(stat.post_id),
      };
    });

    // 다음 페이지가 있는지 확인
    const { count } = await supabase
      .from('post_stats')
      .select('*', { count: 'exact', head: true });

    const totalPosts = count || 0;
    const hasMore = offset + limit < totalPosts;
    const nextPage = hasMore ? page + 1 : null;

    return NextResponse.json<PostsResponse>({
      posts,
      hasMore,
      nextPage,
    });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

