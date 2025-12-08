/**
 * @file format-time.ts
 * @description 시간 포맷팅 유틸리티 함수
 */

/**
 * 상대 시간을 표시합니다.
 * 예: "3시간 전", "2일 전", "1주 전"
 * 1주 이상인 경우 날짜를 표시합니다.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffWeek < 4) {
    return `${diffWeek}주 전`;
  } else {
    // 1주 이상인 경우 날짜 표시
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

