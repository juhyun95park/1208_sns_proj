/**
 * @file use-debounce.ts
 * @description 디바운스 훅
 *
 * 입력값의 변경을 지연시켜 불필요한 API 호출을 방지합니다.
 * 검색 입력 등에 사용됩니다.
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

