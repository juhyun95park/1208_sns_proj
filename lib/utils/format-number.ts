/**
 * @file format-number.ts
 * @description 숫자 포맷팅 유틸리티 함수
 */

/**
 * 좋아요 수를 포맷팅합니다.
 * 예: 1234 → "1,234개"
 */
export function formatLikeCount(count: number): string {
  if (count === 0) {
    return '0개';
  }
  return `${count.toLocaleString('ko-KR')}개`;
}

