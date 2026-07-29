import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchTopics } from "@/api/curricula";
import { TopicChatSection } from "@/components/curriculum/TopicChatSection";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/useAuth";
import type { Topic } from "@/types";

/** 단원별 Q&A 채팅방 페이지. */
export function TopicQnaRoomPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (!user?.curriculum || !topicId) return;
    fetchTopics(user.curriculum.id)
      .then((res) => setTopic(res.items.find((t) => t.id === Number(topicId)) ?? null))
      .catch(() => setTopic(null));
  }, [user?.curriculum, topicId]);

  if (!topicId) return null;

  return (
    <PageContainer>
      <button className="mb-4 text-sm text-gray-400 hover:text-gray-600" onClick={() => navigate(-1)}>
        ← 교육과정으로
      </button>

      <h1 className="mb-1 text-xl font-extrabold text-gray-900">{topic ? topic.title : "Q&A 채팅방"}</h1>
      <p className="mb-6 text-sm text-gray-500">
        질문은 "질문으로 등록"을 체크해서 남겨주세요. 답변이 채택되면 해결됨으로 표시됩니다.
      </p>

      <TopicChatSection topicId={Number(topicId)} />
    </PageContainer>
  );
}
