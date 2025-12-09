/**
 * @file manifest.ts
 * @description PWA 매니페스트
 *
 * Progressive Web App 매니페스트를 생성합니다.
 * 앱 이름, 설명, 아이콘, 테마 색상을 설정합니다.
 */

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Instagram Clone - SNS',
    short_name: 'Instagram Clone',
    description: 'Instagram UI 기반 SNS 애플리케이션',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#0095f6',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

