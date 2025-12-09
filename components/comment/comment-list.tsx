/**
 * @file comment-list.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 댓글 목록을 표시하고 삭제 기능을 제공합니다:
 * - 각 댓글: 사용자명 (Bold) + 내용
 * - 삭제 버튼 (본인만)
 * - 시간 표시 (상대 시간)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/format-time';
import type { CommentWithUser } from '@/types/post';

interface CommentListProps {
  comments: CommentWithUser[];
  currentUserId?: string;
  onCommentDeleted?: (commentId: string) => void;
  showDeleteButton?: boolean;
  className?: string;
}

export function CommentList({
  comments,
  currentUserId,
  onCommentDeleted,
  showDeleteButton = true,
  className = '',
}: CommentListProps) {
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  // 댓글 소유자 확인
  const isCommentOwner = (comment: CommentWithUser) => {
    return currentUserId === comment.user_id;
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '댓글 삭제에 실패했습니다.');
      }

      // 콜백 호출
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(
        err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.'
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {comments.map((comment) => {
        const isOwner = isCommentOwner(comment);

        return (
          <div
            key={comment.id}
            className="group flex items-start gap-2 text-sm text-[#262626]"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${comment.user.id}`}
                className="font-semibold hover:opacity-70 inline-block"
              >
                {comment.user.name}
              </Link>{' '}
              <span>{comment.content}</span>
              <div className="text-xs text-[#8e8e8e] mt-0.5">
                {formatRelativeTime(comment.created_at)}
              </div>
            </div>
            {showDeleteButton && isOwner && (
              <button
                type="button"
                onClick={() => handleDelete(comment.id)}
                disabled={deletingCommentId === comment.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8e8e8e] hover:text-[#ed4956] disabled:opacity-50"
                aria-label="댓글 삭제"
              >
                {deletingCommentId === comment.id ? (
                  <span className="text-xs">삭제 중...</span>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

