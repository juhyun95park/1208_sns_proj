import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // Supabase Storage 도메인 (동적 패턴 지원)
      { hostname: "*.supabase.co" },
      // Dicebear API (프로필 아바타 생성)
      { hostname: "api.dicebear.com" },
      // Placeholder 이미지 (더미 데이터용)
      { hostname: "via.placeholder.com" },
      // Picsum Photos (랜덤 이미지)
      { hostname: "picsum.photos" },
      // Unsplash 이미지
      { hostname: "images.unsplash.com" },
      { hostname: "source.unsplash.com" },
    ],
  },
  // 프로덕션 최적화 설정
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
