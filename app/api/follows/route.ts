/**
 * @file route.ts
 * @description 팔로우 추가/삭제 API
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';
import type { FollowRequest, FollowResponse } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to follow users.' },
        { status: 401 }
      );
    }

    let body: FollowRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { following_id } = body;

    if (!following_id || typeof following_id !== 'string') {
      return NextResponse.json(
        { error: 'following_id is required and must be a string' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.group('팔로우 추가 API');
      console.log('Clerk User ID:', clerkUserId);
      console.log('Following ID:', following_id);
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 조회
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

    // 자기 자신 팔로우 방지
    if (currentUser.id === following_id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // 팔로우할 사용자가 존재하는지 확인
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', following_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User to follow not found' },
        { status: 404 }
      );
    }

    // 팔로우 추가
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUser.id,
        following_id: following_id,
      });

    if (insertError) {
      // 중복 팔로우인 경우 (UNIQUE 제약 조건)
      if (insertError.code === '23505') {
        return NextResponse.json<FollowResponse>(
          {
            success: true,
            is_following: true,
          },
          { status: 200 }
        );
      }
      // 자기 자신 팔로우 방지 (CHECK 제약 조건)
      if (insertError.code === '23514') {
        return NextResponse.json(
          { error: 'Cannot follow yourself' },
          { status: 400 }
        );
      }
      console.error('팔로우 추가 에러:', insertError);
      return NextResponse.json(
        { error: 'Failed to follow user' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('팔로우 추가 성공');
      console.groupEnd();
    }

    return NextResponse.json<FollowResponse>(
      {
        success: true,
        is_following: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/follows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to unfollow users.' },
        { status: 401 }
      );
    }

    let body: FollowRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { following_id } = body;

    if (!following_id || typeof following_id !== 'string') {
      return NextResponse.json(
        { error: 'following_id is required and must be a string' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.group('팔로우 제거 API');
      console.log('Clerk User ID:', clerkUserId);
      console.log('Following ID:', following_id);
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 조회
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

    // 팔로우 제거
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', following_id);

    if (deleteError) {
      console.error('팔로우 제거 에러:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unfollow user' },
        { status: 500 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('팔로우 제거 성공');
      console.groupEnd();
    }

    return NextResponse.json<FollowResponse>(
      {
        success: true,
        is_following: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/follows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

