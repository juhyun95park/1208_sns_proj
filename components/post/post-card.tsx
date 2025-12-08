/**
 * @file post-card.tsx
 * @description Instagram 스타일 PostCard 컴포넌트
 *
 * 게시물 카드 컴포넌트:
 * - 헤더: 프로필 이미지, 사용자명, 시간, 메뉴
 * - 이미지: 1:1 정사각형, 더블탭 좋아요
 * - 액션 버튼: 좋아요, 댓글, 공유, 북마크
 * - 컨텐츠: 좋아요 수, 캡션, 댓글 미리보기
 *
 * @see docs/PRD.md - PostCard 디자인 섹션
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { formatRelativeTime } from '@/lib/utils/format-time';
import { formatLikeCount } from '@/lib/utils/format-number';
import type { PostWithStats, CommentWithUser } from '@/types/post';
import { useAuth } from '@clerk/nextjs';

interface PostCardProps {
  post: PostWithStats;
  comments?: CommentWithUser[];
}

export function PostCard({ post, comments = [] }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [doubleTapHeartVisible, setDoubleTapHeartVisible] = useState(false);
  const lastTapRef = useRef<number>(0);
  const supabase = useClerkSupabaseClient();
  const { userId } = useAuth();

  // 캡션이 2줄을 초과하는지 확인 (간단한 추정)
  const captionLines = post.caption ? post.caption.split('\n') : [];
  const shouldTruncate = captionLines.length > 2 || (post.caption?.length || 0) > 100;
  const displayCaption = showFullCaption
    ? post.caption
    : post.caption?.substring(0, 100);

  const handleLike = async () => {
    // Optimistic Update
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount((prev) => (previousLiked ? prev - 1 : prev + 1));

    try {
      if (previousLiked) {
        // 좋아요 취소
        const response = await fetch('/api/likes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to unlike');
        }
      } else {
        // 좋아요 추가
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
      // 롤백
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      if (!isLiked) {
        handleLike();
        setDoubleTapHeartVisible(true);
        setTimeout(() => {
          setDoubleTapHeartVisible(false);
        }, 1000);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-sm mb-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {/* 프로필 이미지 (Clerk UserButton 사용 가능) */}
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
        <button
          type="button"
          className="p-1 text-[#262626] hover:opacity-70"
          aria-label="더보기"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* 이미지 영역 */}
      <div
        className="relative w-full aspect-square bg-gray-100 overflow-hidden cursor-pointer"
        onDoubleClick={handleDoubleTap}
      >
        <Image
          src={post.image_url}
          alt={post.caption || '게시물 이미지'}
          fill
          className="object-cover"
          sizes="630px"
          priority={false}
        />
        {/* 더블탭 하트 애니메이션 */}
        {doubleTapHeartVisible && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-24 h-24 text-[#ed4956] fill-[#ed4956] animate-double-tap-heart"
              style={{
                animation: 'doubleTapHeart 1s ease-out',
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3 h-[48px]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            className={`transition-transform duration-150 ${
              isLiked ? 'text-[#ed4956]' : 'text-[#262626]'
            } hover:opacity-70`}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            style={{
              animation: isLiked ? 'heartScale 0.3s ease-out' : 'none',
            }}
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

      {/* 컨텐츠 */}
      <div className="px-4 pb-4 space-y-2">
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
            <span>
              {displayCaption}
              {shouldTruncate && !showFullCaption && '...'}
            </span>
            {shouldTruncate && !showFullCaption && (
              <button
                type="button"
                onClick={() => setShowFullCaption(true)}
                className="text-[#8e8e8e] hover:opacity-70 ml-1"
              >
                더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {post.comments_count > 0 && (
          <div className="space-y-1">
            {post.comments_count > 2 && (
              <Link
                href={`/post/${post.id}`}
                className="text-[#8e8e8e] text-sm hover:opacity-70"
              >
                댓글 {post.comments_count}개 모두 보기
              </Link>
            )}
            {comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="text-[#262626]">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-semibold hover:opacity-70"
                >
                  {comment.user.name}
                </Link>{' '}
                <span>{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

