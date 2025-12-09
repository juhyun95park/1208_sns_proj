/**
 * @file robots.ts
 * @description 검색 엔진 크롤러 설정
 *
 * robots.txt 파일을 동적으로 생성합니다.
 * API 라우트와 테스트 페이지는 크롤링에서 제외합니다.
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth-test/',
          '/storage-test/',
          '/instruments/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

