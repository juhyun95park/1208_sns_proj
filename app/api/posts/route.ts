/**
 * @file route.ts
 * @description 게시물 목록 조회 및 생성 API
 *
 * GET /api/posts
 * - 페이지네이션 지원
 * - 시간 역순 정렬
 * - 좋아요 수, 댓글 수 포함
 * - userId 쿼리 파라미터 지원 (프로필 페이지용)
 *
 * POST /api/posts
 * - 게시물 생성
 * - Clerk 인증 필수
 * - image_url, caption 검증
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { PostsResponse, PostWithStats } from '@/types/post';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    const userId = searchParams.get('userId'); // 프로필 페이지용 필터

    const supabase = createClerkSupabaseClient();

    // post_stats 뷰에서 게시물 목록 조회 (좋아요 수, 댓글 수 포함)
    let query = supabase
      .from('post_stats')
      .select('*')
      .order('created_at', { ascending: false });

    // userId 파라미터가 있으면 해당 사용자의 게시물만 필터링
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: postStats, error: statsError } = await query
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
    let countQuery = supabase.from('post_stats').select('*', { count: 'exact', head: true });
    if (userId) {
      countQuery = countQuery.eq('user_id', userId);
    }
    const { count } = await countQuery;

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

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create a post.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { image_url, caption } = body;

    // image_url 검증
    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json(
        { error: 'image_url is required and must be a string' },
        { status: 400 }
      );
    }

    // Storage URL 검증: Supabase Storage URL 형식인지 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const storageUrlPattern = new RegExp(
        `^${supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/storage/v1/object/public/posts/`
      );
      if (!storageUrlPattern.test(image_url)) {
        return NextResponse.json(
          { error: 'Invalid image URL. Must be a valid Supabase Storage URL for the posts bucket.' },
          { status: 400 }
        );
      }
    }

    // 캡션 검증
    if (caption !== undefined && caption !== null) {
      if (typeof caption !== 'string') {
        return NextResponse.json(
          { error: 'caption must be a string' },
          { status: 400 }
        );
      }
      
      // 캡션 길이 검증 (최대 2,200자)
      if (caption.length > 2200) {
        return NextResponse.json(
          { error: 'caption must be 2200 characters or less' },
          { status: 400 }
        );
      }
    }

    const supabase = createClerkSupabaseClient();

    console.group('게시물 생성 API');
    console.log('Clerk User ID:', clerkUserId);
    console.log('Image URL:', image_url);
    console.log('Caption length:', caption?.length || 0);

    // Clerk user ID로 Supabase user 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found. Please ensure your account is properly synced.' },
        { status: 404 }
      );
    }

    console.log('User found:', user.id);

    // 게시물 생성
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        image_url,
        caption: caption?.trim() || null,
      })
      .select('id, user_id, image_url, caption, created_at')
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      
      // 데이터베이스 제약 조건 위반 등 구체적인 에러 처리
      if (postError.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid user reference. Please try again.' },
          { status: 400 }
        );
      } else if (postError.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate post detected. Please try again.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create post. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('Post created:', post.id);

    // post_stats 뷰에서 게시물 정보 조회 (좋아요 수, 댓글 수 포함)
    const { data: postStat, error: statsError } = await supabase
      .from('post_stats')
      .select('*')
      .eq('post_id', post.id)
      .single();

    if (statsError || !postStat) {
      console.error('Error fetching post stats:', statsError);
      // 통계 조회 실패해도 게시물은 생성되었으므로 기본값으로 반환
      const postWithStats: PostWithStats = {
        id: post.id,
        user_id: post.user_id,
        image_url: post.image_url,
        caption: post.caption,
        created_at: post.created_at,
        likes_count: 0,
        comments_count: 0,
        user: {
          id: user.id,
          clerk_id: clerkUserId,
          name: 'Unknown',
        },
        is_liked: false,
      };
      return NextResponse.json({ post: postWithStats });
    }

    // 사용자 정보 조회
    const { data: postUser, error: postUserError } = await supabase
      .from('users')
      .select('id, clerk_id, name')
      .eq('id', postStat.user_id)
      .single();

    if (postUserError || !postUser) {
      console.error('Error fetching post user:', postUserError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const postWithStats: PostWithStats = {
      id: postStat.post_id,
      user_id: postStat.user_id,
      image_url: postStat.image_url,
      caption: postStat.caption,
      created_at: postStat.created_at,
      likes_count: postStat.likes_count || 0,
      comments_count: postStat.comments_count || 0,
      user: {
        id: postUser.id,
        clerk_id: postUser.clerk_id,
        name: postUser.name,
      },
      is_liked: false,
    };

    console.log('Post created successfully:', postWithStats.id);
    console.groupEnd();

    return NextResponse.json({ post: postWithStats }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    
    // 예상치 못한 에러 처리
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

