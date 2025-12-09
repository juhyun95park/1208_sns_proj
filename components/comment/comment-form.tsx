/**
 * @file comment-form.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * Instagram 스타일의 댓글 입력 폼:
 * - 한 줄 입력 필드 ("댓글 달기..." 플레이스홀더)
 * - Enter 키 또는 "게시" 버튼으로 제출
 * - Optimistic update 지원
 */

'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import type { CommentWithUser } from '@/types/post';
import { useAuth } from '@clerk/nextjs';

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: CommentWithUser) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function CommentForm({
  postId,
  onCommentAdded,
  placeholder = '댓글 달기...',
  autoFocus = false,
  className = '',
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    if (!userId) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '댓글 작성에 실패했습니다.');
      }

      const data = await response.json();
      const newComment = data.comment;

      // 콜백 호출
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }

      // 입력 필드 초기화
      setContent('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '댓글 작성에 실패했습니다.';
      setError(errorMessage);
      console.error('Error creating comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키로 제출 (Shift+Enter는 줄바꿈)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isSubmitting || !userId}
        rows={1}
        className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none text-sm text-[#262626] placeholder:text-[#8e8e8e] bg-transparent"
        style={{
          minHeight: '20px',
          maxHeight: '80px',
        }}
      />
      {content.trim() && (
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isSubmitting || !content.trim()}
          className="text-[#0095f6] hover:text-[#0095f6] hover:bg-transparent px-2 py-1 h-auto font-semibold disabled:opacity-50"
        >
          {isSubmitting ? '게시 중...' : '게시'}
        </Button>
      )}
      {error && (
        <p className="text-xs text-[#ed4956] mt-1 absolute bottom-0 left-0">
          {error}
        </p>
      )}
    </form>
  );
}

