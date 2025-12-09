/**
 * @file not-found.tsx
 * @description 404 Not Found 페이지
 *
 * Instagram 스타일 404 페이지:
 * - 깔끔한 디자인
 * - 홈으로 돌아가기 링크
 * - 반응형 레이아웃
 */

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-[#262626] mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-[#262626] mb-2">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-[#8e8e8e]">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            className="bg-[#0095f6] hover:bg-[#0095f6]/90 text-white font-semibold"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="w-4 h-4" />
              홈으로 돌아가기
            </Link>
          </Button>

          <div className="text-sm text-[#8e8e8e]">
            <Link
              href="/profile"
              className="hover:text-[#262626] transition-colors"
            >
              프로필 보기
            </Link>
            {' · '}
            <Link
              href="/"
              className="hover:text-[#262626] transition-colors"
            >
              피드 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

