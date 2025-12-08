/**
 * @file post-card-skeleton.tsx
 * @description PostCard 로딩 스켈레톤 UI
 *
 * Shimmer 효과가 있는 로딩 상태 UI
 */

export function PostCardSkeleton() {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-sm mb-4">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-3 px-4 py-3 h-[60px]">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 이미지 스켈레톤 */}
      <div className="relative w-full aspect-square bg-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
      </div>

      {/* 액션 버튼 스켈레톤 */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex gap-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 컨텐츠 스켈레톤 */}
      <div className="px-4 pb-4 space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2" />
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

