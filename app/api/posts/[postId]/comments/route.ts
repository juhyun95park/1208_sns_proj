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

    const supabase = createClerkSupabaseClient();

    // 최신 댓글 2개 조회
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, post_id, user_id, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(2);

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json<CommentWithUser[]>([]);
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

    return NextResponse.json<CommentWithUser[]>(commentsWithUsers);
  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

