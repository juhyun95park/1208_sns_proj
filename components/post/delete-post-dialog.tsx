/**
 * @file delete-post-dialog.tsx
 * @description 게시물 삭제 확인 다이얼로그 컴포넌트
 *
 * Instagram 스타일 삭제 확인 다이얼로그:
 * - 삭제 확인 메시지 표시
 * - "삭제" 및 "취소" 버튼
 * - 로딩 상태 표시
 * - 삭제 성공/실패 처리
 *
 * @see docs/PRD.md - 게시물 삭제 섹션
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeletePostDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void; // 삭제 성공 콜백
}

export function DeletePostDialog({
  postId,
  open,
  onOpenChange,
  onDeleted,
}: DeletePostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '게시물 삭제에 실패했습니다.');
      }

      // 삭제 성공
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '게시물 삭제에 실패했습니다.';
      setError(errorMessage);
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return; // 삭제 중에는 취소 불가
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#262626]">
            게시물 삭제
          </DialogTitle>
          <DialogDescription className="text-[#8e8e8e] pt-2">
            이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 sm:flex-initial"
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 sm:flex-initial"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

