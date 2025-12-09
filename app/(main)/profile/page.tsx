/**
 * @file page.tsx
 * @description 본인 프로필 페이지
 *
 * 현재 로그인한 사용자의 프로필 페이지로 리다이렉트합니다.
 *
 * Note: Next.js 15에서 redirect()는 내부적으로 NEXT_REDIRECT 에러를 throw합니다.
 * 이는 정상적인 동작이며, Next.js가 이를 처리합니다.
 *
 * @see docs/PRD.md - 프로필 페이지 섹션
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/clerk-server';

export default async function ProfilePage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    redirect('/sign-in');
  }

  // 현재 사용자의 Supabase user_id 조회
  const supabase = createClerkSupabaseClient();
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single();

  if (userError || !currentUser) {
    // 사용자가 동기화되지 않은 경우 홈으로 리다이렉트
    console.error('Error fetching current user:', userError);
    redirect('/');
  }

  // 본인 프로필 페이지로 리다이렉트
  // Note: redirect()는 내부적으로 에러를 throw하지만, 이는 Next.js의 정상 동작입니다.
  redirect(`/profile/${currentUser.id}`);
}

