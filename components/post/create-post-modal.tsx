/**
 * @file create-post-modal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * Instagram 스타일 게시물 작성 UI:
 * - 이미지 선택 및 미리보기
 * - 캡션 입력 (최대 2,200자)
 * - Supabase Storage 업로드
 *
 * @see docs/PRD.md - 게시물 작성 섹션
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Loader2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// 이미지 파일 헤더 시그니처 확인
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF...WEBP
};

/**
 * 파일이 실제 이미지 파일인지 헤더를 통해 검증
 */
async function validateImageFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 12));

      // MIME 타입에 따른 시그니처 확인
      const signatures = IMAGE_SIGNATURES[file.type];
      if (!signatures) {
        resolve(false);
        return;
      }

      // 시그니처 중 하나라도 일치하면 유효한 이미지
      const isValid = signatures.some((signature) => {
        return signature.every((byte, index) => bytes[index] === byte);
      });

      resolve(isValid);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useClerkSupabaseClient();
  const { userId: clerkUserId } = useAuth();
  const router = useRouter();

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // 파일 타입 검증
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, webp)');
        return;
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        setError('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일이 비어있는지 확인
      if (file.size === 0) {
        setError('파일이 비어있습니다.');
        return;
      }

      // 실제 이미지 파일인지 헤더 검증
      const isValidImage = await validateImageFile(file);
      if (!isValidImage) {
        setError('유효하지 않은 이미지 파일입니다. 파일이 손상되었거나 이미지 파일이 아닐 수 있습니다.');
        return;
      }

      setSelectedFile(file);

      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.onerror = () => {
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // 파일 입력 변경 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 파일 제거 핸들러
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 업로드 핸들러
  const handleUpload = async () => {
    if (!selectedFile || !clerkUserId) {
      setError('이미지를 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Supabase Storage에 파일 업로드
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${clerkUserId}/${timestamp}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      // 버킷 이름 가져오기 (환경 변수 또는 기본값)
      const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'posts';

      if (process.env.NODE_ENV === 'development') {
        console.group('게시물 업로드 시작');
        console.log('파일명:', fileName);
        console.log('파일 크기:', `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
        console.log('버킷 이름:', bucketName);
      }
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage 업로드 에러:', uploadError);
        
        // 에러 타입에 따른 구체적인 메시지
        if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket not found')) {
          throw new Error(`Storage 버킷 "${bucketName}"을 찾을 수 없습니다. Supabase Dashboard에서 버킷을 생성해주세요.`);
        } else if (uploadError.message?.includes('duplicate') || uploadError.message?.includes('already exists')) {
          throw new Error('이미 같은 이름의 파일이 존재합니다. 잠시 후 다시 시도해주세요.');
        } else if (uploadError.message?.includes('size') || uploadError.message?.includes('limit')) {
          throw new Error('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('업로드 권한이 없습니다. 로그인 상태를 확인해주세요.');
        } else {
          throw new Error(uploadError.message || '파일 업로드에 실패했습니다.');
        }
      }

      console.log('Storage 업로드 성공:', uploadData);

      // 2. Public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // 3. API를 통해 게시물 생성
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: publicUrl,
          caption: caption.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('API 응답 에러:', data);
        
        // API 에러에 따른 구체적인 메시지
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        } else if (response.status === 400) {
          throw new Error(data.error || '잘못된 요청입니다. 입력 내용을 확인해주세요.');
        } else if (response.status === 404) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        } else {
          throw new Error(data.error || '게시물 생성에 실패했습니다.');
        }
      }

      const result = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('게시물 생성 성공:', result);
          console.groupEnd();
        }

      // 4. 성공 시 모달 닫기 및 피드 새로고침
      handleClose();
      
      // 피드 새로고침: 페이지를 다시 로드하여 최신 게시물 표시
      // router.refresh()는 Server Component만 새로고침하므로, 클라이언트 상태도 갱신하기 위해 페이지 리로드
      window.location.reload();
    } catch (err) {
      console.groupEnd();
      const errorMessage =
        err instanceof Error ? err.message : '게시물 업로드에 실패했습니다.';
      setError(errorMessage);
      console.error('Error uploading post:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    if (isUploading) return; // 업로드 중에는 닫기 방지

    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl w-full h-[90vh] p-0 flex flex-col overflow-hidden"
      >
        {/* 접근성을 위한 숨겨진 DialogTitle */}
        <DialogTitle className="sr-only">
          새 게시물 만들기
        </DialogTitle>
        
        <DialogHeader className="px-6 py-4 border-b border-[#dbdbdb]/50 bg-gradient-to-r from-white to-[#fafafa]/50">
          <h2 className="text-center text-lg font-semibold bg-gradient-to-r from-[#0095f6] to-[#833ab4] bg-clip-text text-transparent">
            새 게시물 만들기
          </h2>
          <p className="sr-only">
            이미지를 선택하고 캡션을 입력하여 새 게시물을 만듭니다.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* 이미지 선택/미리보기 영역 */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#dbdbdb] flex items-center justify-center bg-[#fafafa] min-h-[300px] md:min-h-0">
            {previewUrl ? (
              <div className="relative w-full h-full aspect-square">
                <Image
                  src={previewUrl}
                  alt="미리보기"
                  fill
                  className="object-contain"
                  sizes="50vw"
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-8 cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-16 h-16 text-[#8e8e8e] mb-4" />
                <p className="text-lg font-semibold text-[#262626] mb-2">
                  사진과 동영상을 여기에 끌어다 놓으세요
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  컴퓨터에서 선택
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 캡션 입력 영역 */}
          <div className="w-full md:w-1/2 flex flex-col">
            {previewUrl && (
              <>
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0095f6] via-[#833ab4] to-[#fcb045] flex items-center justify-center shadow-soft ring-2 ring-white">
                      <span className="text-sm font-semibold text-white">
                        {clerkUserId?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-semibold text-[#262626]">
                      {clerkUserId || '사용자'}
                    </span>
                  </div>
                  <Textarea
                    value={caption}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= MAX_CAPTION_LENGTH) {
                        setCaption(value);
                      }
                    }}
                    placeholder="문구 입력..."
                    className="min-h-[200px] resize-none border-0 focus:ring-0 text-[#262626] placeholder:text-[#8e8e8e]"
                    maxLength={MAX_CAPTION_LENGTH}
                  />
                  <div className="text-right text-xs text-[#8e8e8e] mt-2">
                    {caption.length}/{MAX_CAPTION_LENGTH}
                  </div>
                </div>

                {error && (
                  <div className="px-4 pb-2">
                    <p className="text-sm text-[#ed4956]">{error}</p>
                  </div>
                )}

                <div className="border-t border-[#dbdbdb]/50 p-4 bg-gradient-to-r from-white to-[#fafafa]/50">
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                    className="w-full bg-gradient-to-r from-[#0095f6] to-[#0084d4] hover:from-[#0084d4] hover:to-[#0073c2] text-white font-semibold disabled:opacity-50 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        공유 중...
                      </>
                    ) : (
                      '공유하기'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

