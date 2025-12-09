/**
 * @file post.ts
 * @description 게시물 관련 TypeScript 타입 정의
 */

export interface PostWithStats {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    id: string;
    clerk_id: string;
    name: string;
  };
  is_liked?: boolean;
}

export interface CommentWithUser {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}

export interface PostsResponse {
  posts: PostWithStats[];
  hasMore: boolean;
  nextPage: number | null;
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
}

export interface CreateCommentResponse {
  comment: CommentWithUser;
}

export interface PostDetailResponse {
  post: PostWithStats;
}

export interface CommentsResponse {
  comments: CommentWithUser[];
  hasMore: boolean;
  nextPage: number | null;
}

