/**
 * @file post-grid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * Instagram 스타일 게시물 그리드:
 * - 3열 그리드 레이아웃 (반응형)
 * - 1:1 정사각형 썸네일
 * - Hover 시 좋아요/댓글 수 오버레이 표시
 * - 클릭 시 게시물 상세 모달 열기
 *
 * @see docs/PRD.md - 프로필 페이지 섹션
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { PostModal } from '@/components/post/post-modal';
import type { PostWithStats } from '@/types/post';

interface PostGridProps {
  userId: string;
  onPostClick?: (postId: string) => void;
}

export function PostGrid({ userId, onPostClick }: PostGridProps) {
  const [posts, setPosts] = useState<PostWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithStats | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts?userId=${userId}&limit=100`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading posts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadPosts();
    }
  }, [userId]);

  const handlePostClick = (post: PostWithStats) => {
    setSelectedPost(post);
    setSelectedPostId(post.id);
    if (onPostClick) {
      onPostClick(post.id);
    }
  };

  const handleCloseModal = () => {
    setSelectedPostId(null);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#8e8e8e]">게시물을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8e8e8e]">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 탭 (게시물만 표시, 릴스/태그됨은 1차 MVP 제외) */}
      <div className="border-t border-[#dbdbdb]">
        <div className="flex items-center justify-center gap-12">
          <button
            type="button"
            className="py-4 border-t-2 border-[#262626] -mt-px"
          >
            <span className="text-xs font-semibold text-[#262626] uppercase tracking-wider">
              게시물
            </span>
          </button>
        </div>
      </div>

      {/* 게시물 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-4 mt-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
            onClick={() => handlePostClick(post)}
          >
            <Image
              src={post.image_url}
              alt={post.caption || '게시물 이미지'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 33vw, 33vw"
            />
            {/* Hover 오버레이 (Desktop만) */}
            <div className="hidden md:flex absolute inset-0 bg-black/40 items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 text-white">
                <Heart className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="w-5 h-5 fill-white" />
                <span className="font-semibold">{post.comments_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 게시물 상세 모달 */}
      {selectedPostId && selectedPost && (
        <PostModal
          postId={selectedPostId}
          open={!!selectedPostId}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
          }}
          initialPost={selectedPost}
          allPosts={posts}
          onNavigate={(newPostId) => {
            const newPost = posts.find((p) => p.id === newPostId);
            if (newPost) {
              setSelectedPost(newPost);
              setSelectedPostId(newPostId);
            }
          }}
        />
      )}
    </div>
  );
}

