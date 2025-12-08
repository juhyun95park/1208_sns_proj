/**
 * @file localization.ts
 * @description Clerk 한국어 로컬라이제이션 설정
 *
 * Clerk 컴포넌트의 한국어 번역 및 커스텀 메시지를 정의합니다.
 * 필요에 따라 에러 메시지나 특정 텍스트를 커스터마이징할 수 있습니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

import { koKR } from "@clerk/localizations";

/**
 * 한국어 로컬라이제이션 설정
 *
 * 기본 koKR 로컬라이제이션을 사용하며, 필요시 커스텀 메시지를 추가할 수 있습니다.
 *
 * @example
 * ```tsx
 * import { clerkLocalization } from '@/lib/clerk/localization';
 *
 * <ClerkProvider appearance={{ localization: clerkLocalization }}>
 *   ...
 * </ClerkProvider>
 * ```
 */
export const clerkLocalization = {
  ...koKR,
  // 커스텀 에러 메시지 예시
  // unstable__errors: {
  //   not_allowed_access:
  //     "접근이 허용되지 않은 이메일 도메인입니다. 접근을 원하시면 이메일로 문의해주세요.",
  //   form_identifier_not_found:
  //     "입력한 이메일 주소를 찾을 수 없습니다.",
  //   form_password_incorrect:
  //     "비밀번호가 올바르지 않습니다.",
  // },
};

/**
 * 기본 한국어 로컬라이제이션 (커스터마이징 없이)
 *
 * Clerk의 기본 한국어 번역을 그대로 사용합니다.
 */
export { koKR };

