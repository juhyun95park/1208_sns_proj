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
import { PostModal } from './post-modal';
import type { PostWithStats, CommentWithUser } from '@/types/post';

interface PostFeedProps {
  initialPosts?: PostWithStats[];
}

export function PostFeed({ initialPosts = [] }: PostFeedProps) {
  // 초기 게시물도 중복 제거
  const [posts, setPosts] = useState<PostWithStats[]>(() => {
    const uniquePosts: PostWithStats[] = [];
    const seenIds = new Set<string>();
    
    for (const post of initialPosts) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        uniquePosts.push(post);
      }
    }
    
    return uniquePosts;
  });
  const [commentsMap, setCommentsMap] = useState<
    Record<string, CommentWithUser[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPosts.length > 0 ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [modalPostId, setModalPostId] = useState<string | null>(null);
  const [modalPost, setModalPost] = useState<PostWithStats | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 댓글 추가 핸들러
  const handleCommentAdded = useCallback(
    (postId: string, comment: CommentWithUser) => {
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [comment, ...(prev[postId] || [])],
      }));

      // 게시물의 comments_count 업데이트
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments_count: p.comments_count + 1 }
            : p
        )
      );
    },
    []
  );

  // 댓글 삭제 핸들러
  const handleCommentDeleted = useCallback((postId: string, commentId: string) => {
    setCommentsMap((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));

    // 게시물의 comments_count 업데이트
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
          : p
      )
    );
  }, []);

  // 모달 열기 핸들러
  const handleOpenModal = useCallback((postId: string) => {
    const post = posts.find((p) => p.id === postId);
    setModalPost(post || null);
    setModalPostId(postId);
  }, [posts]);

  // 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setModalPostId(null);
    setModalPost(null);
  }, []);

  // 게시물 삭제 핸들러
  const handlePostDeleted = useCallback(
    (deletedPostId: string) => {
      // 삭제된 게시물을 목록에서 제거
      setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));

      // 모달이 열려있으면 닫기
      if (modalPostId === deletedPostId) {
        handleCloseModal();
      }
    },
    [modalPostId, handleCloseModal]
  );

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
    if (loading) {
      console.log('PostFeed: Already loading, skipping...');
      return;
    }

    console.log(`PostFeed: Loading posts page ${pageNum}...`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      console.log('PostFeed: API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log('PostFeed: Received data:', { 
        postsCount: data.posts?.length || 0, 
        hasMore: data.hasMore 
      });
      
      const newPosts = data.posts || [];

      if (newPosts.length === 0) {
        console.log('PostFeed: No posts found');
        setHasMore(false);
      } else {
        // 중복 제거: 기존 게시물 ID Set을 사용하여 중복 필터링
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewPosts = newPosts.filter(
            (post: PostWithStats) => !existingIds.has(post.id)
          );
          
          if (uniqueNewPosts.length === 0) {
            console.log('PostFeed: All new posts are duplicates, skipping...');
            return prev;
          }
          
          console.log(`PostFeed: Adding ${uniqueNewPosts.length} new posts (${newPosts.length - uniqueNewPosts.length} duplicates filtered)`);
          return [...prev, ...uniqueNewPosts];
        });
        setPage((prev) => prev + 1);
        setHasMore(data.hasMore);

        // 각 게시물의 댓글 로드 (중복 제거된 게시물만)
        // setPosts의 함수형 업데이트 내에서 처리하므로 여기서는 모든 새 게시물의 댓글 로드
        newPosts.forEach((post: PostWithStats) => {
          if (post.comments_count > 0) {
            loadComments(post.id);
          }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('PostFeed: Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, loadComments]);

  // 초기 로드 (initialPosts가 없는 경우)
  useEffect(() => {
    if (initialPosts.length === 0 && page === 1 && !loading) {
      console.log('PostFeed: Initial load starting...');
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

  if (posts.length === 0 && !loading && !error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8e8e8e] mb-2">게시물이 없습니다.</p>
        <p className="text-xs text-[#8e8e8e]">
          더미 데이터를 생성하려면 Supabase SQL Editor에서 
          <code className="bg-gray-100 px-1 rounded mx-1">supabase/seed-dummy-data.sql</code> 
          파일을 실행하세요.
        </p>
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
          onCommentAdded={(comment) => handleCommentAdded(post.id, comment)}
          onCommentDeleted={(commentId) =>
            handleCommentDeleted(post.id, commentId)
          }
          onOpenModal={handleOpenModal}
          onPostDeleted={handlePostDeleted}
        />
      ))}

      {/* 게시물 상세 모달 */}
      {modalPostId && (
        <PostModal
          postId={modalPostId}
          open={!!modalPostId}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
          initialPost={modalPost || undefined}
          allPosts={posts}
          onNavigate={(newPostId) => {
            const newPost = posts.find((p) => p.id === newPostId);
            setModalPost(newPost || null);
            setModalPostId(newPostId);
          }}
          onPostDeleted={handlePostDeleted}
        />
      )}

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

