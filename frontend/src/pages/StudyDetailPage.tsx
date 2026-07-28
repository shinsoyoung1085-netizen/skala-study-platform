import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { extractErrorMessage } from "@/api/client";
import {
  deleteStudy,
  fetchStudyDetail,
  fetchStudyMembers,
  joinStudy,
  leaveStudy,
  recommendLeader,
} from "@/api/studies";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { Toast } from "@/components/common/Toast";
import { PageContainer } from "@/components/layout/PageContainer";
import { RecommendLeaderModal } from "@/components/study/RecommendLeaderModal";
import type { Study, StudyMember } from "@/types";

/** 스터디 상세 페이지: 정보 조회, 참여, 탈퇴를 처리한다. 개설자에게는 참여자 목록도 보여준다. */
export function StudyDetailPage() {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();

  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const [members, setMembers] = useState<StudyMember[] | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // 개설자에게만 참여자 목록을 별도로 불러온다.
  useEffect(() => {
    if (!study?.is_creator) {
      setMembers(null);
      return;
    }
    setMembersError(null);
    fetchStudyMembers(study.id)
      .then(setMembers)
      .catch((err) => setMembersError(extractErrorMessage(err, "참여자 목록을 불러오지 못했습니다.")));
  }, [study?.id, study?.is_creator, study?.current_member_count]);

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

  const handleRecommend = async (reasonTag: string) => {
    if (!study) return;
    try {
      const res = await recommendLeader(study.id, { reason_tag: reasonTag });
      setIsRecommendModalOpen(false);
      setToastMessage(`익명으로 모임장님께 ${res.points_given}P와 칭찬 메시지를 전달했습니다! 🎉`);
    } catch (err) {
      setIsRecommendModalOpen(false);
      setError(extractErrorMessage(err, "모임장 추천에 실패했습니다."));
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
              <div className="flex gap-1.5">
                <Badge tone="primary">{study.category_label}</Badge>
                <Badge tone="neutral">{study.campus_label}</Badge>
              </div>
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

          {study.is_joined && !study.is_creator && (
            <button
              type="button"
              onClick={() => setIsRecommendModalOpen(true)}
              className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3.5 text-left transition-colors hover:bg-primary-100"
            >
              <div>
                <p className="text-sm font-bold text-primary-700">모임장 추천하기</p>
                <p className="text-xs text-primary-600">칭찬 태그 하나로 익명 응원과 포인트를 전달해보세요</p>
              </div>
              <Badge tone="primary">+50P</Badge>
            </button>
          )}

          {study.is_creator && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">참여자 목록 (개설자만 볼 수 있어요)</h2>
              {membersError && <Alert>{membersError}</Alert>}
              {!membersError && !members && <Spinner label="참여자 목록을 불러오는 중..." />}
              {members && (
                <div className="flex flex-col gap-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-800">{member.name}</span>
                        <span className="ml-2 text-gray-400">
                          {member.username} · {member.campus_label}
                        </span>
                      </div>
                      {member.username === study.creator.username && <Badge tone="primary">개설자</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

      {isRecommendModalOpen && (
        <RecommendLeaderModal onClose={() => setIsRecommendModalOpen(false)} onSelect={handleRecommend} />
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
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
