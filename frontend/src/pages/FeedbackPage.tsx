import { useCallback, useEffect, useState, type FormEvent } from "react";

import { createFeedback, deleteFeedback, fetchFeedback } from "@/api/feedback";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import { FEEDBACK_CATEGORY_OPTIONS } from "@/constants/feedbackCategories";
import { useAuth } from "@/hooks/useAuth";
import type { Feedback } from "@/types";

const CATEGORY_TONE: Record<string, "primary" | "neutral" | "success" | "danger"> = {
  PRAISE: "success",
  SUGGESTION: "primary",
  BUG: "danger",
  ETC: "neutral",
};

/** SKALA STUDY 앱 자체에 대한 익명 후기/건의 게시판. 작성자 정보는 서버 응답에도 포함되지 않는다. */
export function FeedbackPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(FEEDBACK_CATEGORY_OPTIONS[0].code);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchFeedback();
      setItems(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "후기를 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await createFeedback({ category, content });
      setContent("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "등록에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("이 글을 삭제하시겠습니까?")) return;
    try {
      await deleteFeedback(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "삭제에 실패했습니다."));
    }
  };

  return (
    <PageContainer>
      <h1 className="mb-1 text-xl font-extrabold text-gray-900">후기/건의</h1>
      <p className="mb-6 text-sm text-gray-500">
        SKALA STUDY에 대한 솔직한 후기나 건의를 익명으로 남겨주세요. 작성자 정보는 저장되지 않습니다.
      </p>

      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
          {error && <Alert>{error}</Alert>}
          <Select
            label="분류"
            options={FEEDBACK_CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="자유롭게 후기/건의를 남겨주세요 (익명)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            required
          />
          <Button type="submit" isLoading={isSubmitting} disabled={!content.trim()}>
            익명으로 등록
          </Button>
        </form>

        {!items && !error && <Spinner />}
        {items && items.length === 0 && (
          <p className="card py-10 text-center text-sm text-gray-400">아직 등록된 후기/건의가 없습니다.</p>
        )}

        <div className="flex flex-col gap-4">
          {items?.map((item) => (
            <div key={item.id} className="card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge tone={CATEGORY_TONE[item.category] ?? "neutral"}>{item.category_label}</Badge>
                {(item.is_mine || user?.is_admin) && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{item.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.is_mine ? "내가 쓴 글" : "익명"}</span>
                <span>{new Date(item.created_at).toLocaleString("ko-KR")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
