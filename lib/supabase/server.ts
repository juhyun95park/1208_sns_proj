/**
 * @file server.ts
 * @description Supabase 서버 사이드 클라이언트 (Server Component용)
 *
 * Supabase 공식 Next.js 가이드에 따른 표준 구현:
 * - Cookie-based 인증 지원
 * - Server Component에서 사용
 * - @supabase/ssr 패키지 사용
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase 서버 클라이언트 생성 (Server Component용)
 *
 * Supabase 공식 방식으로 Cookie-based 인증을 지원합니다.
 * Server Component에서 사용할 때는 이 함수를 사용하세요.
 *
 * @example
 * ```tsx
 * // Server Component
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function MyPage() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or Publishable Key is missing. Please check your environment variables.'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
