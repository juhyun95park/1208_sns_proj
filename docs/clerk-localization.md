# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 목차

1. [기본 설정](#1-기본-설정)
2. [커스텀 메시지](#2-커스텀-메시지)
3. [에러 메시지 커스터마이징](#3-에러-메시지-커스터마이징)
4. [지원되는 언어](#4-지원되는-언어)

## 1. 기본 설정

프로젝트는 이미 한국어 로컬라이제이션이 설정되어 있습니다. `app/layout.tsx`에서 다음과 같이 설정됩니다:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: "clerk", // Tailwind CSS v4 호환성
        localization: koKR, // 한국어 로컬라이제이션
      }}
    >
      {children}
    </ClerkProvider>
  );
}
```

이 설정으로 모든 Clerk 컴포넌트(SignIn, SignUp, UserButton 등)가 한국어로 표시됩니다.

## 2. 커스텀 메시지

특정 메시지를 커스터마이징하려면 `lib/clerk/localization.ts` 파일을 수정하세요:

```tsx
import { koKR } from "@clerk/localizations";

export const clerkLocalization = {
  ...koKR,
  signUp: {
    start: {
      subtitle: "{{applicationName}}에 가입하세요",
    },
    emailCode: {
      subtitle: "{{applicationName}}에 가입하세요",
    },
  },
};
```

그리고 `app/layout.tsx`에서 사용:

```tsx
import { clerkLocalization } from "@/lib/clerk/localization";

<ClerkProvider appearance={{ localization: clerkLocalization }}>
  {children}
</ClerkProvider>
```

## 3. 에러 메시지 커스터마이징

에러 메시지를 커스터마이징하려면 `unstable__errors` 키를 사용합니다:

```tsx
import { koKR } from "@clerk/localizations";

export const clerkLocalization = {
  ...koKR,
  unstable__errors: {
    not_allowed_access:
      "접근이 허용되지 않은 이메일 도메인입니다. 접근을 원하시면 이메일로 문의해주세요.",
    form_identifier_not_found:
      "입력한 이메일 주소를 찾을 수 없습니다.",
    form_password_incorrect:
      "비밀번호가 올바르지 않습니다.",
    form_password_pwned:
      "이 비밀번호는 보안상 위험합니다. 다른 비밀번호를 사용해주세요.",
    form_password_length_too_short:
      "비밀번호는 최소 8자 이상이어야 합니다.",
    form_username_invalid_length:
      "사용자 이름은 3자 이상 20자 이하여야 합니다.",
  },
};
```

### 사용 가능한 에러 키

전체 에러 키 목록은 [Clerk GitHub 저장소의 영어 로컬라이제이션 파일](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)에서 `unstable__errors` 객체를 검색하여 확인할 수 있습니다.

주요 에러 키:
- `not_allowed_access`: 허용되지 않은 도메인 접근 시도
- `form_identifier_not_found`: 이메일/사용자명을 찾을 수 없음
- `form_password_incorrect`: 비밀번호가 올바르지 않음
- `form_password_pwned`: 비밀번호가 유출된 비밀번호 목록에 있음
- `form_password_length_too_short`: 비밀번호가 너무 짧음
- `form_username_invalid_length`: 사용자 이름 길이가 유효하지 않음

## 4. 지원되는 언어

Clerk는 다음 언어를 지원합니다:

| 언어 | 키 | BCP 47 태그 |
|------|-----|-------------|
| 한국어 | `koKR` | `ko-KR` |
| 영어 (미국) | `enUS` | `en-US` |
| 영어 (영국) | `enGB` | `en-GB` |
| 일본어 | `jaJP` | `ja-JP` |
| 중국어 (간체) | `zhCN` | `zh-CN` |
| 중국어 (번체) | `zhTW` | `zh-TW` |
| 프랑스어 | `frFR` | `fr-FR` |
| 독일어 | `deDE` | `de-DE` |
| 스페인어 | `esES` | `es-ES` |
| 포르투갈어 (브라질) | `ptBR` | `pt-BR` |
| 러시아어 | `ruRU` | `ru-RU` |

전체 언어 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)를 참고하세요.

## 주의사항

> [!WARNING]
> 로컬라이제이션 기능은 현재 실험적(experimental) 단계입니다. 예상치 못한 동작이 발생할 수 있으므로, 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요.

### 제한사항

- 로컬라이제이션은 Clerk 컴포넌트의 텍스트만 변경합니다.
- [Clerk Account Portal](https://clerk.com/docs/guides/customizing-clerk/account-portal)은 여전히 영어로 표시됩니다.

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [Clerk GitHub - 로컬라이제이션 소스 코드](https://github.com/clerk/javascript/tree/main/packages/localizations)
- [BCP 47 언어 태그](https://en.wikipedia.org/wiki/IETF_language_tag)

