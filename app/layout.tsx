/**
 * @file layout.tsx
 * @description Root Layout with Clerk Provider
 *
 * Clerk 인증을 전역적으로 설정하고 한국어 로컬라이제이션을 적용합니다.
 * Tailwind CSS v4 호환성을 위해 appearance prop을 사용합니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instagram Clone - SNS",
  description: "Instagram UI 기반 SNS 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: "clerk", // Tailwind CSS v4 호환성
        localization: koKR, // 한국어 로컬라이제이션
      }}
    >
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>{children}</SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
