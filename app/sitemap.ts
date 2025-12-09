/**
 * @file sitemap.ts
 * @description 사이트맵 생성
 *
 * 동적 사이트맵을 생성합니다.
 * 주요 페이지 URL을 포함합니다.
 */

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}

