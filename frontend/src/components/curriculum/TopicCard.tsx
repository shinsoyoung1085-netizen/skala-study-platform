import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/common/Badge";
import type { Topic } from "@/types";

/** 커리큘럼 대시보드에서 단원 하나를 표시하는 카드. 클릭하면 해당 단원의 Q&A 채팅방으로 이동한다. */
export function TopicCard({ topic }: { topic: Topic }) {
  const navigate = useNavigate();

  return (
    <button
      className="card card-hover flex flex-col gap-3 text-left"
      onClick={() => navigate(`/curriculum/topics/${topic.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge tone="neutral">{topic.order}주차</Badge>
      </div>
      <h3 className="text-base font-bold text-gray-900">{topic.title}</h3>
      <p className="mt-auto text-sm text-gray-400">메시지 {topic.message_count}개</p>
    </button>
  );
}
