import { useState, type FormEvent } from "react";

import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { TagInput } from "@/components/common/TagInput";
import type { PostCreatePayload } from "@/types";

interface PostComposerProps {
  onSubmit: (payload: PostCreatePayload) => Promise<void>;
}

/** 정보 공유 게시글 작성 폼. 태그는 1개 이상 필수다. */
export function PostComposer({ onSubmit }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    if (tags.length === 0) {
      setError("태그를 1개 이상 등록해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ content: content.trim(), tags });
      setContent("");
      setTags([]);
    } catch (err) {
      setError(extractErrorMessage(err, "게시글 작성에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}

      <textarea
        className="min-h-[96px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
        placeholder="스터디원들과 나누고 싶은 정보를 공유해보세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <TagInput value={tags} onChange={setTags} label="태그 (필수, 1개 이상)" />

      <Button type="submit" isLoading={isSubmitting}>
        게시하기
      </Button>
    </form>
  );
}
