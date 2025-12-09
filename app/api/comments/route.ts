/**
 * @file route.ts
 * @description 댓글 작성 API
 *
 * POST /api/comments
 * - 댓글 작성
 * - Clerk 인증 필수
 * - post_id, content 검증
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import type { CommentWithUser } from '@/types/post';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { post_id, content } = body;

    // 검증
    if (!post_id || typeof post_id !== 'string') {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'content is required and cannot be empty' },
        { status: 400 }
      );
    }

    // 최대 길이 제한 (1,000자)
    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'content must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // Clerk user ID로 Supabase user 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 게시물 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 댓글 생성
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id,
        user_id: user.id,
        content: content.trim(),
      })
      .select('id, post_id, user_id, content, created_at')
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // 사용자 정보 조회
    const { data: commentUser, error: commentUserError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', user.id)
      .single();

    if (commentUserError || !commentUser) {
      console.error('Error fetching comment user:', commentUserError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const commentWithUser: CommentWithUser = {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: commentUser.id,
        name: commentUser.name,
      },
    };

    return NextResponse.json({ comment: commentWithUser });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

