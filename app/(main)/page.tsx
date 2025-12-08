/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일 홈 피드:
 * - 게시물 목록 표시 (PostCard는 다음 단계에서 구현)
 * - 무한 스크롤 (다음 단계에서 구현)
 *
 * @see docs/PRD.md - 홈 피드 섹션
 */

export default function HomePage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#262626] mb-6">홈</h1>
      <div className="space-y-4">
        <p className="text-[#8e8e8e] text-center py-8">
          게시물이 없습니다. PostCard 컴포넌트는 다음 단계에서 구현됩니다.
        </p>
      </div>
    </div>
  );
}

