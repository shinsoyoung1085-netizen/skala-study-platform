import { useCallback, useEffect, useState } from "react";

import { createClassByAdmin, deleteClassByAdmin, fetchAllClassesForAdmin } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { ClassFormModal } from "@/components/admin/ClassFormModal";
import type { AdminClassItem, ClassCreatePayload } from "@/types";

/** 관리자 "반 관리" 탭: 캠퍼스별 반 생성/삭제. 리더보드의 캠퍼스-반-개인 계층에 쓰이는 반을 관리한다. */
export function ClassManagementPanel() {
  const [classes, setClasses] = useState<AdminClassItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setClasses(await fetchAllClassesForAdmin());
    } catch (err) {
      setError(extractErrorMessage(err, "반 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (payload: ClassCreatePayload) => {
    await createClassByAdmin(payload);
    setShowCreateModal(false);
    await load();
  };

  const handleDelete = async (item: AdminClassItem) => {
    const warning =
      item.member_count > 0
        ? `이 반에는 ${item.member_count}명이 소속되어 있습니다. 삭제하면 그 회원들은 반 미배정 상태가 됩니다. 삭제하시겠습니까?`
        : "이 반을 삭제하시겠습니까?";
    if (!window.confirm(warning)) return;
    try {
      await deleteClassByAdmin(item.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "반 삭제에 실패했습니다."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">반 관리</h3>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          + 반 생성
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {!classes && !error && <Spinner label="불러오는 중..." />}

      {classes && classes.length === 0 && (
        <p className="card py-8 text-center text-sm text-gray-400">생성된 반이 없습니다.</p>
      )}

      {classes && classes.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">캠퍼스</th>
                <th className="py-2 pr-4">반 이름</th>
                <th className="py-2 pr-4">소속 인원</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4">{c.campus_label}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{c.name}</td>
                  <td className="py-3 pr-4">{c.member_count}명</td>
                  <td className="py-3">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(c)}>
                      삭제
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <ClassFormModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
