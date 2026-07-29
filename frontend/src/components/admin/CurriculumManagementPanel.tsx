import { useCallback, useEffect, useState } from "react";

import { createCurriculumByAdmin, deleteCurriculumByAdmin } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { fetchCurricula } from "@/api/curricula";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { CurriculumFormModal } from "@/components/admin/CurriculumFormModal";
import { TopicManagerModal } from "@/components/admin/TopicManagerModal";
import type { Curriculum, CurriculumCreatePayload } from "@/types";

/** 관리자 "교육과정" 탭: 교육과정 생성/삭제 및 단원 관리 진입점. */
export function CurriculumManagementPanel() {
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topicManagerTarget, setTopicManagerTarget] = useState<Curriculum | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchCurricula();
      setCurricula(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "교육과정 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (payload: CurriculumCreatePayload) => {
    await createCurriculumByAdmin(payload);
    setShowCreateModal(false);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("이 교육과정을 삭제하시겠습니까? 소속 단원/Q&A/게시글도 함께 삭제됩니다.")) return;
    try {
      await deleteCurriculumByAdmin(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "교육과정 삭제에 실패했습니다."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">교육과정 관리</h3>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          + 교육과정 생성
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {!curricula && !error && <Spinner label="불러오는 중..." />}

      {curricula && curricula.length === 0 && (
        <p className="card py-8 text-center text-sm text-gray-400">생성된 교육과정이 없습니다.</p>
      )}

      {curricula && curricula.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">교육과정명</th>
                <th className="py-2 pr-4">단원 수</th>
                <th className="py-2 pr-4">소속 인원</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {curricula.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{c.title}</td>
                  <td className="py-3 pr-4">{c.topic_count}</td>
                  <td className="py-3 pr-4">{c.member_count}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTopicManagerTarget(c)}>
                        단원 관리
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <CurriculumFormModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} />
      )}

      {topicManagerTarget && (
        <TopicManagerModal
          curriculum={topicManagerTarget}
          onClose={() => setTopicManagerTarget(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
