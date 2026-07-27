import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { extractErrorMessage } from "@/api/client";
import { deleteStudy, fetchMyStudies, leaveStudy } from "@/api/studies";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Study } from "@/types";

/** 내가 참여중인 스터디 목록 페이지. 상세보기와 탈퇴하기를 제공한다. */
export function MyStudiesPage() {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchMyStudies();
      setStudies(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "내 스터디 목록을 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLeave = async (studyId: number) => {
    if (!window.confirm("정말 이 스터디에서 탈퇴하시겠습니까?")) return;
    setLeavingId(studyId);
    try {
      await leaveStudy(studyId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 탈퇴에 실패했습니다."));
    } finally {
      setLeavingId(null);
    }
  };

  const handleDelete = async (studyId: number) => {
    if (!window.confirm("정말 이 스터디를 삭제하시겠습니까? 참여중인 회원도 모두 함께 빠지게 됩니다.")) return;
    setDeletingId(studyId);
    try {
      await deleteStudy(studyId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 삭제에 실패했습니다."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer>
      <h1 className="mb-6 text-xl font-extrabold text-gray-900">내 스터디</h1>

      {error && <Alert>{error}</Alert>}

      {isLoading ? (
        <Spinner />
      ) : studies.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-gray-400">아직 참여중인 스터디가 없어요.</p>
          <Button onClick={() => navigate("/studies")}>스터디 둘러보기</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {studies.map((study) => (
            <div key={study.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge tone="primary">{study.category_label}</Badge>
                <h2 className="mt-1 text-base font-bold text-gray-900">{study.name}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {study.day_label} · {study.time} · {study.location_label}
                </p>
                <p className="text-sm text-gray-500">
                  {study.current_member_count} / {study.capacity}명
                  {study.exam_date ? ` · 시험일 ${study.exam_date}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/studies/${study.id}`)}>
                  상세보기
                </Button>
                {study.is_creator ? (
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deletingId === study.id}
                    onClick={() => handleDelete(study.id)}
                  >
                    삭제하기
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={leavingId === study.id}
                    onClick={() => handleLeave(study.id)}
                  >
                    탈퇴하기
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
