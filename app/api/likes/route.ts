/**
 * @file route.ts
 * @description 좋아요 추가/삭제 API
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 취소
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 좋아요 추가
    const { error: insertError } = await supabase
      .from('likes')
      .insert({
        post_id,
        user_id: user.id,
      });

    if (insertError) {
      // 중복 좋아요인 경우 (UNIQUE 제약 조건)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Already liked' },
          { status: 409 }
        );
      }
      console.error('Error inserting like:', insertError);
      return NextResponse.json(
        { error: 'Failed to add like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 user_id 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove like' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/likes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

