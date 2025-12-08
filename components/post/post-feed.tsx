/**
 * @file post-feed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 게시물 목록 표시 및 무한 스크롤 구현:
 * - Intersection Observer를 사용한 무한 스크롤
 * - 로딩 상태 관리 (Skeleton UI)
 * - 에러 처리
 *
 * @see docs/PRD.md - 홈 피드 섹션
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PostCard } from './post-card';
import { PostCardSkeleton } from './post-card-skeleton';
import type { PostWithStats, CommentWithUser } from '@/types/post';

interface PostFeedProps {
  initialPosts?: PostWithStats[];
}

export function PostFeed({ initialPosts = [] }: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithStats[]>(initialPosts);
  const [commentsMap, setCommentsMap] = useState<
    Record<string, CommentWithUser[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPosts.length > 0 ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 댓글 로드 함수
  const loadComments = useCallback(async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const comments: CommentWithUser[] = await response.json();
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: comments,
      }));
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, []);

  // 게시물 로드 함수
  const loadPosts = useCallback(async (pageNum: number) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      const newPosts = data.posts || [];

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage((prev) => prev + 1);
        setHasMore(data.hasMore);

        // 각 게시물의 댓글 로드
        newPosts.forEach((post: PostWithStats) => {
          if (post.comments_count > 0) {
            loadComments(post.id);
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, loadComments]);

  // 초기 로드 (initialPosts가 없는 경우)
  useEffect(() => {
    if (initialPosts.length === 0 && page === 1) {
      loadPosts(1);
    } else if (initialPosts.length > 0) {
      // initialPosts의 댓글 로드
      initialPosts.forEach((post) => {
        if (post.comments_count > 0) {
          loadComments(post.id);
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPosts(page);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, loadPosts]);

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8e8e8e]">게시물을 불러오는 중 오류가 발생했습니다.</p>
        <button
          type="button"
          onClick={() => loadPosts(1)}
          className="mt-4 text-[#0095f6] hover:opacity-70"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (posts.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8e8e8e]">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          comments={commentsMap[post.id] || []}
        />
      ))}

      {/* 로딩 스켈레톤 */}
      {loading && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}

      {/* 무한 스크롤 타겟 */}
      {hasMore && !loading && (
        <div ref={observerTarget} className="h-4" />
      )}

      {/* 에러 메시지 */}
      {error && posts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-[#8e8e8e] text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

