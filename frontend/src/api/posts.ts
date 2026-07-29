import { apiClient } from "@/api/client";
import type { PostCreatePayload, PostListResponse, Post } from "@/types";

export async function fetchPosts(tags: string[] = []): Promise<PostListResponse> {
  // FastAPI의 list[str] 쿼리 파라미터는 tag=a&tag=b 형태를 기대하는데, axios 기본 배열
  // 직렬화는 tag[]=a&tag[]=b를 만들어버리므로 URLSearchParams로 직접 반복 키를 구성한다.
  const params = new URLSearchParams();
  tags.forEach((t) => params.append("tag", t));
  const { data } = await apiClient.get<PostListResponse>("/api/posts", { params });
  return data;
}

export async function fetchPostTags(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/api/posts/tags");
  return data;
}

export async function createPost(payload: PostCreatePayload): Promise<Post> {
  const { data } = await apiClient.post<Post>("/api/posts", payload);
  return data;
}
