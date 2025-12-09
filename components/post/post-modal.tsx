/**
 * @file post-modal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * Desktop: Dialog 모달 형식 (이미지 50% + 댓글 영역 50%)
 * Mobile: 전체 화면 모달
 * - 게시물 상세 정보 표시
 * - 전체 댓글 목록 (스크롤 가능, 무한 스크롤)
 * - 댓글 작성/삭제 기능
 * - 좋아요 기능
 *
 * @see docs/PRD.md - 게시물 상세 모달 섹션
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { formatRelativeTime } from '@/lib/utils/format-time';
import { formatLikeCount } from '@/lib/utils/format-number';
import type { PostWithStats, CommentWithUser } from '@/types/post';
import { useAuth } from '@clerk/nextjs';
import { CommentForm } from '@/components/comment/comment-form';
import { CommentList } from '@/components/comment/comment-list';
import { DeletePostDialog } from './delete-post-dialog';

interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPost?: PostWithStats;
  allPosts?: PostWithStats[]; // 네비게이션용 전체 게시물 목록
  onNavigate?: (postId: string) => void; // 네비게이션 콜백
  onPostDeleted?: (postId: string) => void; // 삭제 성공 콜백
}

export function PostModal({
  postId,
  open,
  onOpenChange,
  initialPost,
  allPosts = [],
  onNavigate,
  onPostDeleted,
}: PostModalProps) {
  const [post, setPost] = useState<PostWithStats | null>(initialPost || null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentsPage, setCommentsPage] = useState(1);
  const [isLiked, setIsLiked] = useState(post?.is_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(
    post?.comments_count || 0
  );
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const supabase = useClerkSupabaseClient();
  const { userId: clerkUserId } = useAuth();

  // 현재 사용자의 Supabase user_id 조회
  useEffect(() => {
    if (clerkUserId) {
      supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentUserId(data.id);
          }
        });
    }
  }, [clerkUserId, supabase]);

  // 메뉴 외부 클릭 시 닫기 및 키보드 네비게이션
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  // 본인 게시물인지 확인
  const isOwnPost = post && currentUserId === post.user_id;

  // 삭제 핸들러
  const handleDelete = () => {
    setIsMenuOpen(false);
    setIsDeleteDialogOpen(true);
  };

  // 삭제 성공 콜백
  const handleDeleted = () => {
    if (onPostDeleted) {
      onPostDeleted(postId);
    }
    // 모달 닫기
    onOpenChange(false);
  };

  // 게시물 상세 정보 로드
  const loadPost = useCallback(async () => {
    if (initialPost) {
      setPost(initialPost);
      setIsLiked(initialPost.is_liked || false);
      setLikesCount(initialPost.likes_count);
      setCommentsCount(initialPost.comments_count);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      setPost(data.post);
      setIsLiked(data.post.is_liked || false);
      setLikesCount(data.post.likes_count);
      setCommentsCount(data.post.comments_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading post:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, initialPost]);

  // 댓글 목록 로드
  const loadComments = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (isLoadingComments) return;

      setIsLoadingComments(true);

      try {
        const response = await fetch(
          `/api/posts/${postId}/comments?limit=20&page=${page}&order=asc`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        const newComments = data.comments || [];

        if (append) {
          setComments((prev) => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }

        setHasMoreComments(data.hasMore);
        // 다음 페이지 설정 (API에서 반환된 nextPage 사용, 없으면 현재 페이지 + 1)
        setCommentsPage(data.nextPage || page + 1);
      } catch (err) {
        console.error('Error loading comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [postId, isLoadingComments]
  );

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (open) {
      loadPost();
      loadComments(1, false);
      setCommentsPage(1);
      setHasMoreComments(true);
    } else {
      // 모달이 닫힐 때 상태 초기화
      setComments([]);
      setError(null);
    }
  }, [open, loadPost, loadComments]);

  // 댓글 무한 스크롤
  useEffect(() => {
    if (!open || !hasMoreComments || isLoadingComments) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreComments && !isLoadingComments) {
          const nextPage = commentsPage;
          loadComments(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = commentsEndRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [open, hasMoreComments, isLoadingComments, commentsPage, loadComments]);

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!post) return;

    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount((prev) => (previousLiked ? prev - 1 : prev + 1));

    try {
      if (previousLiked) {
        const response = await fetch('/api/likes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to unlike');
        }
      } else {
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to like');
        }
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
    }
  };

  // 댓글 추가 핸들러
  const handleCommentAdded = (newComment: CommentWithUser) => {
    setComments((prev) => [newComment, ...prev]);
    setCommentsCount((prev) => prev + 1);
  };

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  // 네비게이션: 현재 게시물 인덱스 찾기
  const currentIndex = allPosts.findIndex((p) => p.id === postId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allPosts.length - 1;
  const previousPostId = hasPrevious ? allPosts[currentIndex - 1].id : null;
  const nextPostId = hasNext ? allPosts[currentIndex + 1].id : null;

  // 이전 게시물로 이동
  const handlePrevious = () => {
    if (previousPostId && onNavigate) {
      onNavigate(previousPostId);
    }
  };

  // 다음 게시물로 이동
  const handleNext = () => {
    if (nextPostId && onNavigate) {
      onNavigate(nextPostId);
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrevious, hasNext, previousPostId, nextPostId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!post && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogOverlay />
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col md:flex-row">
          <DialogTitle className="sr-only">게시물 로딩 중</DialogTitle>
          <div className="flex items-center justify-center flex-1">
            <p className="text-[#8e8e8e]">로딩 중...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !post) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogOverlay />
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col md:flex-row">
          <DialogTitle className="sr-only">게시물 오류</DialogTitle>
          <div className="flex items-center justify-center flex-1">
            <p className="text-[#ed4956]">{error || '게시물을 불러올 수 없습니다.'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent
        className="max-w-4xl w-full h-[90vh] md:h-[90vh] h-screen md:h-[90vh] p-0 flex flex-col md:flex-row overflow-hidden md:rounded-lg rounded-none"
      >
        <DialogTitle className="sr-only">
          {post.user.name}의 게시물
        </DialogTitle>
        {/* Desktop: 좌측 이미지 영역 (50%) */}
        <div className="hidden md:flex md:w-1/2 bg-black items-center justify-center relative">
          <div className="relative w-full h-full">
            <Image
              src={post.image_url}
              alt={post.caption || `${post.user.name}의 게시물 이미지`}
              fill
              className="object-contain"
              sizes="50vw"
            />
          </div>
          {/* 이전/다음 네비게이션 버튼 (Desktop만) */}
          {hasPrevious && (
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
              aria-label="이전 게시물"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
              aria-label="다음 게시물"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Mobile: 상단 이미지 영역 */}
        <div className="md:hidden w-full aspect-square bg-black relative">
          <Image
            src={post.image_url}
            alt={post.caption || `${post.user.name}의 게시물 이미지`}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>

        {/* 우측 댓글 영역 (Desktop 50%, Mobile 전체) */}
        <div className="flex flex-col w-full md:w-1/2 bg-white h-full overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user.id}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <span className="text-sm font-semibold text-[#262626]">
                    {post.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
              <div>
                <Link
                  href={`/profile/${post.user.id}`}
                  className="font-semibold text-[#262626] hover:opacity-70"
                >
                  {post.user.name}
                </Link>
                <p className="text-xs text-[#8e8e8e]">
                  {formatRelativeTime(post.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1 text-[#262626] hover:opacity-70 md:hidden"
                onClick={() => onOpenChange(false)}
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="p-1 text-[#262626] hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:ring-offset-2 rounded"
                  aria-label="더보기 메뉴"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsMenuOpen(!isMenuOpen);
                    }
                  }}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {isMenuOpen && isOwnPost && (
                  <div
                    className="absolute right-0 top-8 bg-white border border-[#dbdbdb] rounded-md shadow-lg z-10 min-w-[160px]"
                    role="menu"
                    aria-label="게시물 메뉴"
                  >
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-[#ed4956] hover:bg-[#fafafa] flex items-center gap-2 focus:outline-none focus:bg-[#fafafa]"
                      role="menuitem"
                      onClick={handleDelete}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDelete();
                        } else if (e.key === 'Escape') {
                          setIsMenuOpen(false);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 댓글 목록 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`transition-transform duration-150 ${
                    isLiked ? 'text-[#ed4956]' : 'text-[#262626]'
                  } hover:opacity-70`}
                  aria-label={isLiked ? '좋아요 취소' : '좋아요'}
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isLiked ? 'fill-[#ed4956]' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  className="text-[#262626] hover:opacity-70"
                  aria-label="댓글"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  className="text-[#262626] hover:opacity-70"
                  aria-label="공유"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button
                type="button"
                className="text-[#262626] hover:opacity-70"
                aria-label="북마크"
              >
                <Bookmark className="w-6 h-6" />
              </button>
            </div>

            {/* 좋아요 수 */}
            {likesCount > 0 && (
              <p className="font-semibold text-[#262626]">
                좋아요 {formatLikeCount(likesCount)}
              </p>
            )}

            {/* 캡션 */}
            {post.caption && (
              <div className="text-[#262626]">
                <Link
                  href={`/profile/${post.user.id}`}
                  className="font-semibold hover:opacity-70"
                >
                  {post.user.name}
                </Link>{' '}
                <span>{post.caption}</span>
              </div>
            )}

            {/* 댓글 목록 */}
            {comments.length > 0 && (
              <CommentList
                comments={comments}
                currentUserId={currentUserId}
                onCommentDeleted={handleCommentDeleted}
                showDeleteButton={true}
              />
            )}

            {/* 무한 스크롤 타겟 */}
            {hasMoreComments && !isLoadingComments && (
              <div ref={commentsEndRef} className="h-4" />
            )}

            {/* 로딩 인디케이터 */}
            {isLoadingComments && (
              <div className="text-center py-4">
                <p className="text-sm text-[#8e8e8e]">댓글 로딩 중...</p>
              </div>
            )}

            {/* 더 이상 댓글이 없을 때 */}
            {!hasMoreComments && comments.length > 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-[#8e8e8e]">모든 댓글을 불러왔습니다.</p>
              </div>
            )}

            {/* 더 이상 댓글이 없을 때 */}
            {!hasMoreComments && comments.length > 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-[#8e8e8e]">모든 댓글을 불러왔습니다.</p>
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <div className="border-t border-[#dbdbdb] px-4 py-3">
            <CommentForm
              postId={post.id}
              onCommentAdded={handleCommentAdded}
              placeholder="댓글 달기..."
            />
          </div>
        </div>
      </DialogContent>

      {/* 삭제 확인 다이얼로그 */}
      {post && (
        <DeletePostDialog
          postId={post.id}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onDeleted={handleDeleted}
        />
      )}
    </Dialog>
  );
}

