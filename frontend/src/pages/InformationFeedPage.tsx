import { useCallback, useEffect, useState } from "react";

import { extractErrorMessage } from "@/api/client";
import { createPost, fetchPostTags, fetchPosts } from "@/api/posts";
import { Alert } from "@/components/common/Alert";
import { Spinner } from "@/components/common/Spinner";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { TagFilterBar } from "@/components/feed/TagFilterBar";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Post } from "@/types";

/** 정보 공유 피드: 태그 필터 + 게시글 작성/목록. */
export function InformationFeedPage() {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      setAllTags(await fetchPostTags());
    } catch {
      setAllTags([]);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchPosts(selectedTags);
      setPosts(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "게시글을 불러오지 못했습니다."));
    }
  }, [selectedTags]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleCreate = async (payload: Parameters<typeof createPost>[0]) => {
    await createPost(payload);
    await Promise.all([loadTags(), loadPosts()]);
  };

  return (
    <PageContainer>
      <h1 className="mb-6 text-xl font-extrabold text-gray-900">정보 공유</h1>

      <div className="flex flex-col gap-6">
        <PostComposer onSubmit={handleCreate} />

        <TagFilterBar tags={allTags} selected={selectedTags} onToggle={toggleTag} />

        {error && <Alert>{error}</Alert>}
        {!posts && !error && <Spinner />}

        {posts && posts.length === 0 && (
          <p className="card py-10 text-center text-sm text-gray-400">
            {selectedTags.length > 0 ? "해당 태그의 게시글이 없습니다." : "아직 등록된 게시글이 없습니다."}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {posts?.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </PageContainer>
  );
}
