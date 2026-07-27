import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import type { Study } from "@/types";

interface StudyCardProps {
  study: Study;
  onJoin?: (studyId: number) => void;
  joinLoading?: boolean;
}

/** 스터디 목록에서 사용하는 카드형 컴포넌트. */
export function StudyCard({ study, onJoin, joinLoading = false }: StudyCardProps) {
  const navigate = useNavigate();

  return (
    <div className="card card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <button
            className="text-left text-base font-bold text-gray-900 hover:text-primary"
            onClick={() => navigate(`/studies/${study.id}`)}
          >
            {study.name}
          </button>
          <div className="flex gap-1.5">
            <Badge tone="primary">{study.category_label}</Badge>
            <Badge tone="neutral">{study.campus_label}</Badge>
          </div>
        </div>
        {study.is_full && <Badge tone="danger">모집완료</Badge>}
      </div>

      <div className="flex flex-col gap-1 text-sm text-gray-500">
        <p>
          {study.day_label} · {study.time}
        </p>
        <p>
          {study.location_label}
          {study.is_online ? " · 온라인" : ""}
        </p>
        {study.exam_date && <p className="text-primary-700">시험일 {study.exam_date}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-sm font-medium text-gray-700">
          {study.current_member_count} / {study.capacity}명
        </span>
        {onJoin && (
          <Button
            size="sm"
            variant={study.is_joined ? "outline" : "primary"}
            disabled={study.is_joined || study.is_full}
            isLoading={joinLoading}
            onClick={() => onJoin(study.id)}
          >
            {study.is_joined ? "참여중" : study.is_full ? "모집완료" : "참여하기"}
          </Button>
        )}
      </div>
    </div>
  );
}
