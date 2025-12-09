/**
 * @file explore/page.tsx
 * @description 검색/탐색 페이지
 *
 * Instagram 스타일 검색 페이지:
 * - 사용자 검색 (이름으로 검색)
 * - 검색 결과 표시 (프로필 링크, 통계 정보)
 * - 디바운스를 통한 성능 최적화
 *
 * @see docs/PRD.md - 검색 섹션
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from '@/hooks/use-debounce';
import type { UserWithStats } from '@/types/user';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 디바운스된 검색어 (500ms 지연)
  const debouncedQuery = useDebounce(searchQuery, 500);

  // 검색 실행
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.'
      );
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 디바운스된 검색어가 변경되면 검색 실행
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  return (
    <div className="w-full max-w-[630px] mx-auto px-4 py-8">
      {/* 검색 입력 */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8e8e8e] transition-colors duration-200" />
          <input
            type="text"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-white border border-[#dbdbdb]/50 rounded-xl text-[#262626] placeholder:text-[#8e8e8e] focus:outline-none focus:border-[#0095f6] focus:ring-2 focus:ring-[#0095f6]/20 shadow-soft hover:shadow-medium transition-all duration-200"
            aria-label="사용자 검색"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0095f6] animate-spin" />
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {searchQuery ? (
        <div>
          {error ? (
            <div className="text-center py-16">
              <p className="text-[#ed4956]">{error}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#262626] mb-4">
                검색 결과
              </h2>
              {searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-4 p-4 bg-white border border-[#dbdbdb]/50 rounded-xl hover:bg-gradient-to-r hover:from-[#fafafa] hover:to-white hover:border-[#0095f6]/30 hover:shadow-medium transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0095f6] via-[#833ab4] to-[#fcb045] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-soft ring-2 ring-white group-hover:ring-[#0095f6]/30 transition-all duration-200 group-hover:scale-105">
                    <Image
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={`${user.name} 프로필`}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#262626] truncate group-hover:text-[#0095f6] transition-colors duration-200">
                      {user.name}
                    </p>
                    <p className="text-sm text-[#8e8e8e]">
                      게시물 {user.posts_count} · 팔로워 {user.followers_count}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="text-center py-16">
              <p className="text-[#8e8e8e] mb-2">검색 결과 없음</p>
              <p className="text-sm text-[#8e8e8e]">
                &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#8e8e8e] mb-2">탐색</p>
          <p className="text-sm text-[#8e8e8e]">
            사용자 이름을 검색해보세요.
          </p>
        </div>
      )}
    </div>
  );
}

