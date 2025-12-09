/**
 * @file user.ts
 * @description 사용자 관련 TypeScript 타입 정의
 */

export interface UserWithStats {
  id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean; // 현재 사용자가 팔로우 중인지
}

export interface UserResponse {
  user: UserWithStats;
}

export interface FollowRequest {
  following_id: string; // 팔로우할 사용자 ID (Supabase UUID)
}

export interface FollowResponse {
  success: boolean;
  is_following: boolean;
}

export interface SearchResponse {
  users: UserWithStats[];
}
