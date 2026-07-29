import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { acceptTopicMessage, fetchExperts, fetchTopicMessages, sendTopicMessage } from "@/api/curricula";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { useAuth } from "@/hooks/useAuth";
import type { TopicMessage, UserSummary } from "@/types";

const POLL_INTERVAL_MS = 4000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * 단원(Topic) 전용 Q&A 채팅. StudyChatSection(폴링 기반 그룹 채팅)과 동일한 구조에
 * 질문 등록, 전문가 추천, 답변 채택 기능을 얹은 컴포넌트.
 */
export function TopicChatSection({ topicId }: { topicId: number }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  const [category, setCategory] = useState("");
  const [replyTo, setReplyTo] = useState<TopicMessage | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [experts, setExperts] = useState<UserSummary[] | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchTopicMessages(topicId);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, "채팅 메시지를 불러오지 못했습니다."));
    } finally {
      setIsLoaded(true);
    }
  }, [topicId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // 질문 카테고리를 입력하는 동안 해당 분야 이해도가 HIGH인 같은 교육과정 멤버를 추천해준다.
  useEffect(() => {
    if (!isQuestion || category.trim().length === 0) {
      setExperts(null);
      return;
    }
    const timer = setTimeout(() => {
      fetchExperts(topicId, category.trim())
        .then(setExperts)
        .catch(() => setExperts(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [isQuestion, category, topicId]);

  const messageById = useMemo(() => {
    const map = new Map<number, TopicMessage>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  const skillCategoryOptions = user?.skills.map((s) => s.category) ?? [];

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (isQuestion && !replyTo && category.trim().length === 0) {
      setError("질문으로 등록하려면 분야를 입력해주세요.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const sent = await sendTopicMessage(topicId, {
        content,
        is_question: !replyTo && isQuestion,
        category: !replyTo && isQuestion ? category.trim() : null,
        reply_to_id: replyTo?.id ?? null,
      });
      setMessages((prev) => [...prev, sent]);
      setDraft("");
      setIsQuestion(false);
      setCategory("");
      setReplyTo(null);
    } catch (err) {
      setError(extractErrorMessage(err, "메시지 전송에 실패했습니다."));
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async (messageId: number) => {
    try {
      const updated = await acceptTopicMessage(topicId, messageId);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "답변 채택에 실패했습니다."));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert>{error}</Alert>}

      <div className="flex h-[28rem] flex-col rounded-xl border border-gray-100 bg-gray-50">
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!isLoaded ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 메시지가 없어요. 첫 질문이나 메시지를 남겨보세요!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const parent = msg.reply_to_id ? messageById.get(msg.reply_to_id) : undefined;
                const canAccept =
                  !!parent && parent.is_mine && !parent.is_solved && !msg.is_accepted;

                return (
                  <div key={msg.id} className={`flex flex-col ${msg.is_mine ? "items-end" : "items-start"}`}>
                    {!msg.is_mine && <span className="mb-1 text-xs text-gray-400">{msg.sender_name}</span>}

                    {msg.is_question && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <Badge tone="primary">질문 · {msg.category}</Badge>
                        {msg.is_solved ? (
                          <Badge tone="success">해결됨</Badge>
                        ) : (
                          <Badge tone="neutral">답변대기</Badge>
                        )}
                      </div>
                    )}
                    {parent && (
                      <span className="mb-1 max-w-[260px] truncate text-xs text-gray-400">
                        ↳ "{parent.content}"에 대한 답변
                        {msg.is_accepted && " · 채택됨"}
                      </span>
                    )}

                    <div className="flex items-end gap-2">
                      {msg.is_mine && <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>}
                      <div
                        className={`max-w-[280px] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                          msg.is_mine ? "bg-primary text-white" : "bg-white text-gray-800 border border-gray-100"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {!msg.is_mine && <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>}
                    </div>

                    <div className="mt-1 flex gap-2">
                      {msg.is_question && !msg.is_solved && (
                        <button
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() => setReplyTo(msg)}
                        >
                          답장
                        </button>
                      )}
                      {canAccept && (
                        <button
                          className="text-xs font-medium text-green-600 hover:underline"
                          onClick={() => handleAccept(msg.id)}
                        >
                          채택하기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={listEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-gray-100 bg-white p-3">
          {replyTo && (
            <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-1.5 text-xs text-primary-700">
              <span className="truncate">"{replyTo.content}" 질문에 답장하는 중</span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-2 shrink-0">
                ✕
              </button>
            </div>
          )}

          {!replyTo && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-primary"
                checked={isQuestion}
                onChange={(e) => setIsQuestion(e.target.checked)}
              />
              질문으로 등록
            </label>
          )}

          {!replyTo && isQuestion && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                list="skill-category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="분야 (예: 운영체제)"
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
              <datalist id="skill-category-options">
                {skillCategoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {experts && experts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <span>이 분야 전문가:</span>
                  {experts.map((expert) => (
                    <Badge key={expert.id} tone="success">
                      {expert.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={replyTo ? "답변을 입력하세요" : "메시지를 입력하세요"}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isSending || draft.trim().length === 0}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
            >
              보내기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
