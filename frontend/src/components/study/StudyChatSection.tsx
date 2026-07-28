import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { extractErrorMessage } from "@/api/client";
import { fetchStudyMessages, sendStudyMessage } from "@/api/studies";
import { Alert } from "@/components/common/Alert";
import type { ChatMessage } from "@/types";

const POLL_INTERVAL_MS = 4000;

interface StudyChatSectionProps {
  studyId: number;
  isMember: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

/** 스터디 참여자 전용 그룹 채팅. 4초 간격 폴링으로 새 메시지를 갱신한다. */
export function StudyChatSection({ studyId, isMember }: StudyChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const listEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchStudyMessages(studyId);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err, "채팅 메시지를 불러오지 못했습니다."));
    } finally {
      setIsLoaded(true);
    }
  }, [studyId]);

  useEffect(() => {
    if (!isMember) return;
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isMember, load]);

  // 메시지가 갱신될 때마다(최초 진입 포함) 맨 아래로 스크롤한다.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setIsSending(true);
    try {
      const sent = await sendStudyMessage(studyId, { content });
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (err) {
      setError(extractErrorMessage(err, "메시지 전송에 실패했습니다."));
    } finally {
      setIsSending(false);
    }
  };

  if (!isMember) {
    return (
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">스터디원 채팅</h2>
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          스터디에 참여하면 채팅에 참여할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">스터디원 채팅</h2>

      {error && <Alert>{error}</Alert>}

      <div className="flex h-80 flex-col rounded-xl border border-gray-100 bg-gray-50">
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!isLoaded ? (
            <p className="py-8 text-center text-sm text-gray-400">불러오는 중...</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              아직 메시지가 없어요. 첫 메시지를 남겨보세요!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.is_mine ? "items-end" : "items-start"}`}
                >
                  {!msg.is_mine && <span className="mb-1 text-xs text-gray-400">{msg.sender_name}</span>}
                  <div className="flex items-end gap-2">
                    {msg.is_mine && <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>}
                    <div
                      className={`max-w-[240px] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                        msg.is_mine
                          ? "bg-primary text-white"
                          : "bg-white text-gray-800 border border-gray-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {!msg.is_mine && <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>}
                  </div>
                </div>
              ))}
              <div ref={listEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 bg-white p-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isSending || draft.trim().length === 0}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );
}
