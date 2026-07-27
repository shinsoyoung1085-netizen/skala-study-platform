import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { extractErrorMessage } from "@/api/client";
import { deleteStudy, fetchStudyDetail, joinStudy, leaveStudy } from "@/api/studies";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Study } from "@/types";

/** 스터디 상세 페이지: 정보 조회, 참여, 탈퇴를 처리한다. */
export function StudyDetailPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();

  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    if (!studyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStudyDetail(Number(studyId));
      setStudy(data);
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 정보를 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async () => {
    if (!study) return;
    setIsActing(true);
    setError(null);
    try {
      await joinStudy(study.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 참여에 실패했습니다."));
    } finally {
      setIsActing(false);
    }
  };

  const handleLeave = async () => {
    if (!study) return;
    if (!window.confirm("정말 이 스터디에서 탈퇴하시겠습니까?")) return;
    setIsActing(true);
    setError(null);
    try {
      await leaveStudy(study.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 탈퇴에 실패했습니다."));
    } finally {
      setIsActing(false);
    }
  };

  const handleDelete = async () => {
    if (!study) return;
    if (!window.confirm("정말 이 스터디를 삭제하시겠습니까? 참여중인 회원도 모두 함께 빠지게 됩니다.")) return;
    setIsActing(true);
    setError(null);
    try {
      await deleteStudy(study.id);
      navigate("/studies", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 삭제에 실패했습니다."));
      setIsActing(false);
    }
  };

  return (
    <PageContainer>
      <button className="mb-4 text-sm text-gray-400 hover:text-gray-600" onClick={() => navigate(-1)}>
        ← 목록으로
      </button>

      {isLoading && <Spinner />}
      {error && <Alert>{error}</Alert>}

      {study && (
        <div className="card flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone="primary">{study.category_label}</Badge>
              <h1 className="mt-2 text-2xl font-extrabold text-gray-900">{study.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                개설자: {study.creator.name} ({study.creator.username})
              </p>
            </div>
            {study.is_full && <Badge tone="danger">모집완료</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4">
            <InfoItem label="요일" value={study.day_label} />
            <InfoItem label="시간" value={study.time} />
            <InfoItem label="장소" value={study.location_label} />
            <InfoItem label="인원" value={`${study.current_member_count} / ${study.capacity}명`} />
            {study.exam_date && <InfoItem label="시험일자" value={study.exam_date} />}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">스터디 설명</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {study.description || "등록된 설명이 없습니다."}
            </p>
          </div>

          <div className="flex gap-3">
            {study.is_creator ? (
              <Button variant="danger" onClick={handleDelete} isLoading={isActing}>
                스터디 삭제하기
              </Button>
            ) : study.is_joined ? (
              <Button variant="danger" onClick={handleLeave} isLoading={isActing}>
                탈퇴하기
              </Button>
            ) : (
              <Button onClick={handleJoin} isLoading={isActing} disabled={study.is_full}>
                {study.is_full ? "모집완료" : "참여하기"}
              </Button>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
