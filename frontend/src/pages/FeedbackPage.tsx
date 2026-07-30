import { useCallback, useEffect, useState, type FormEvent } from "react";

import { generateFeedbackAiDraft, updateFeedbackByAdmin } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { createFeedback, deleteFeedback, editFeedback, fetchFeedback } from "@/api/feedback";
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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiSuggestedResolved, setAiSuggestedResolved] = useState<boolean | null>(null);

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

  const startEdit = (item: Feedback) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEditSubmit = async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await editFeedback(id, { content: editContent });
      cancelEdit();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "수정에 실패했습니다."));
    }
  };

  const startReply = (item: Feedback) => {
    setReplyingId(item.id);
    setReplyContent(item.admin_reply ?? "");
    setAiNote(null);
    setAiSuggestedResolved(null);
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyContent("");
    setAiNote(null);
    setAiSuggestedResolved(null);
  };

  const handleReplySubmit = async (id: number) => {
    if (!replyContent.trim()) return;
    try {
      await updateFeedbackByAdmin(id, { admin_reply: replyContent });
      cancelReply();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "답변 등록에 실패했습니다."));
    }
  };

  const handleGenerateAiDraft = async (item: Feedback) => {
    setReplyingId(item.id);
    setAiLoadingId(item.id);
    setAiNote(null);
    setAiSuggestedResolved(null);
    try {
      const draft = await generateFeedbackAiDraft(item.id);
      setReplyContent(draft.draft_reply);
      setAiNote(draft.feasibility_note);
      setAiSuggestedResolved(draft.suggested_resolved);
    } catch (err) {
      setError(extractErrorMessage(err, "AI 초안 생성에 실패했습니다."));
    } finally {
      setAiLoadingId(null);
    }
  };

  const toggleResolved = async (item: Feedback) => {
    try {
      await updateFeedbackByAdmin(item.id, { is_resolved: !item.is_resolved });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "상태 변경에 실패했습니다."));
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={CATEGORY_TONE[item.category] ?? "neutral"}>{item.category_label}</Badge>
                  {item.is_resolved && <Badge tone="success">해결됨</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {item.is_mine && editingId !== item.id && (
                    <button onClick={() => startEdit(item)} className="hover:text-primary">
                      수정
                    </button>
                  )}
                  {(item.is_mine || user?.is_admin) && (
                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500">
                      삭제
                    </button>
                  )}
                </div>
              </div>

              {editingId === item.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    className="min-h-[80px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={1000}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEdit}>
                      취소
                    </Button>
                    <Button size="sm" disabled={!editContent.trim()} onClick={() => handleEditSubmit(item.id)}>
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{item.content}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{item.is_mine ? "내가 쓴 글" : "익명"}</span>
                <span>{new Date(item.created_at).toLocaleString("ko-KR")}</span>
              </div>

              {item.admin_reply && replyingId !== item.id && (
                <div className="rounded-xl bg-primary-50 px-4 py-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary-700">관리자 답변</span>
                    {item.replied_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(item.replied_at).toLocaleString("ko-KR")}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{item.admin_reply}</p>
                </div>
              )}

              {user?.is_admin && (
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                  {replyingId === item.id ? (
                    <div className="flex flex-col gap-2">
                      {aiNote && (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          <span className="font-semibold">AI 현실성 검토: </span>
                          {aiNote}
                          {aiSuggestedResolved !== null && (
                            <span className="ml-1 text-amber-600">
                              (AI 추천: {aiSuggestedResolved ? "이 답변으로 해결 처리 가능" : "추가 조치 필요, 해결 처리 보류 권장"})
                            </span>
                          )}
                        </div>
                      )}
                      <textarea
                        className="min-h-[80px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                        placeholder="답변을 입력하세요"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        maxLength={1000}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={aiLoadingId === item.id}
                          onClick={() => handleGenerateAiDraft(item)}
                        >
                          AI 초안 생성
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelReply}>
                          취소
                        </Button>
                        <Button size="sm" disabled={!replyContent.trim()} onClick={() => handleReplySubmit(item.id)}>
                          답변 저장
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={aiLoadingId === item.id}
                        onClick={() => handleGenerateAiDraft(item)}
                      >
                        AI 초안 생성
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => startReply(item)}>
                        {item.admin_reply ? "답변 수정" : "답변 작성"}
                      </Button>
                      <Button
                        variant={item.is_resolved ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => toggleResolved(item)}
                      >
                        {item.is_resolved ? "미해결로 되돌리기" : "해결 완료 처리"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
