/**
 * @file route.ts
 * @description 게시물 상세 조회 및 삭제 API
 *
 * GET /api/posts/[postId]
 * - 단일 게시물 조회
 * - 좋아요 수, 댓글 수 포함
 * - 현재 사용자의 좋아요 상태 확인
 *
 * DELETE /api/posts/[postId]
 * - 게시물 삭제
 * - 본인만 삭제 가능 (인증 검증)
 * - Supabase Storage에서 이미지 삭제
 * - 데이터베이스에서 게시물 삭제 (CASCADE로 관련 데이터도 삭제)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { PostWithStats } from '@/types/post';

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

    // post_stats 뷰에서 게시물 조회
    const { data: postStat, error: statsError } = await supabase
      .from('post_stats')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (statsError || !postStat) {
      console.error('Error fetching post:', statsError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, name')
      .eq('id', postStat.user_id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 현재 사용자가 좋아요한 게시물 확인 (인증된 경우)
    let isLiked = false;
    try {
      const { userId } = await auth();
      if (userId) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', userId)
          .single();

        if (currentUser) {
          const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUser.id)
            .single();

          isLiked = !!like;
        }
      }
    } catch (error) {
      // 인증되지 않은 경우 무시
      console.log('User not authenticated, skipping like status check');
    }

    // 게시물 데이터 구성
    const post: PostWithStats = {
      id: postStat.post_id,
      user_id: postStat.user_id,
      image_url: postStat.image_url,
      caption: postStat.caption,
      created_at: postStat.created_at,
      likes_count: postStat.likes_count,
      comments_count: postStat.comments_count,
      user: {
        id: user.id,
        clerk_id: user.clerk_id,
        name: user.name,
      },
      is_liked: isLiked,
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in GET /api/posts/[postId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to delete posts.' },
        { status: 401 }
      );
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.group('게시물 삭제 API');
      console.log('Post ID:', postId);
      console.log('Clerk User ID:', clerkUserId);
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user_id 조회
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error('현재 사용자 조회 에러:', userError);
      return NextResponse.json(
        { error: 'User not found. Please ensure your account is properly synced.' },
        { status: 404 }
      );
    }

    // 게시물 조회 및 소유자 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, image_url')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('게시물 조회 에러:', postError);
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 소유자 확인 (본인만 삭제 가능)
    if (post.user_id !== currentUser.id) {
      console.error('권한 없음: 본인 게시물이 아님');
      return NextResponse.json(
        { error: 'Forbidden. You can only delete your own posts.' },
        { status: 403 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('게시물 소유자 확인 완료');
    }

    // Storage에서 이미지 파일 삭제
    if (post.image_url) {
      try {
        // image_url에서 파일 경로 추출
        // 예: https://xxx.supabase.co/storage/v1/object/public/posts/user_xxx/1234567890_abc123.jpg
        // → posts/user_xxx/1234567890_abc123.jpg
        const urlParts = post.image_url.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // posts/user_xxx/filename.jpg
          if (process.env.NODE_ENV === 'development') {
            console.log('Storage 파일 경로:', filePath);
          }

          const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'posts';
          const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

          if (storageError) {
            console.error('Storage 삭제 에러:', storageError);
            // Storage 삭제 실패해도 데이터베이스 삭제는 진행
            // (이미지는 나중에 정리 가능)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Storage 파일 삭제 성공');
            }
          }
        } else {
          console.warn('이미지 URL 형식이 예상과 다름:', post.image_url);
        }
      } catch (storageErr) {
        console.error('Storage 삭제 중 예외 발생:', storageErr);
        // Storage 삭제 실패해도 데이터베이스 삭제는 진행
      }
    }

    // 데이터베이스에서 게시물 삭제
    // CASCADE로 인해 관련 likes, comments도 자동 삭제됨
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      console.error('게시물 삭제 에러:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('게시물 삭제 성공');
      console.groupEnd();
    }

    return NextResponse.json(
      { success: true, message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/posts/[postId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

