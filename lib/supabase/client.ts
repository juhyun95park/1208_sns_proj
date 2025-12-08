/**
 * @file client.ts
 * @description Supabase 브라우저 클라이언트 (Client Component용)
 *
 * Supabase 공식 Next.js 가이드에 따른 표준 구현:
 * - Browser 환경 최적화
 * - Client Component에서 사용
 * - @supabase/ssr 패키지 사용
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase 브라우저 클라이언트 생성 (Client Component용)
 *
 * Supabase 공식 방식으로 브라우저 환경에 최적화된 클라이언트를 생성합니다.
 * Client Component에서 사용할 때는 이 함수를 사용하세요.
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { createClient } from '@/lib/supabase/client';
 *
 * export default function MyComponent() {
 *   const supabase = createClient();
 *   const { data } = await supabase.from('table').select('*');
 *   return <div>...</div>;
 * }
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or Publishable Key is missing. Please check your environment variables.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
