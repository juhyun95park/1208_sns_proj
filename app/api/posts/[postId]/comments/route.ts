/**
 * @file route.ts
 * @description 게시물 댓글 조회 API
 *
 * GET /api/posts/[postId]/comments
 * - 특정 게시물의 최신 댓글 조회
 * - PostCard에서 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import type { CommentWithUser } from '@/types/post';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '2', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    const supabase = createClerkSupabaseClient();

    // 댓글 조회 (페이지네이션)
    // 모달에서는 오래된 순으로, PostCard에서는 최신순으로
    // 기본값은 최신순 (PostCard 호환성)
    const orderAscending = searchParams.get('order') === 'asc';
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: orderAscending })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // 전체 댓글 수 확인 (hasMore 판단용)
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const totalComments = count || 0;
    const hasMore = offset + limit < totalComments;
    const nextPage = hasMore ? page + 1 : null;

    if (!comments || comments.length === 0) {
      return NextResponse.json({
        comments: [],
        hasMore: false,
        nextPage: null,
      });
    }

    // 사용자 정보 조회
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 사용자 정보를 맵으로 변환
    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 댓글 데이터 구성
    const commentsWithUsers: CommentWithUser[] = comments.map((comment) => {
      const user = userMap.get(comment.user_id);
      return {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        user: user || {
          id: comment.user_id,
          name: 'Unknown',
        },
      };
    });

    return NextResponse.json({
      comments: commentsWithUsers,
      hasMore,
      nextPage,
    });
  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

