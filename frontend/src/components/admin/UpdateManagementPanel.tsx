import { useCallback, useEffect, useState } from "react";

import {
  createUpdate,
  deleteUpdateByAdmin,
  editUpdate,
  fetchAllUpdatesForAdmin,
} from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { UpdateFormModal } from "@/components/admin/UpdateFormModal";
import type { UpdateCreatePayload, UpdateNotice } from "@/types";

/** 관리자 "업데이트 관리" 탭: 공지 작성/수정/삭제 및 활성화 여부 관리. */
export function UpdateManagementPanel() {
  const [updates, setUpdates] = useState<UpdateNotice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | UpdateNotice | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchAllUpdatesForAdmin();
      setUpdates(list);
    } catch (err) {
      setError(extractErrorMessage(err, "업데이트 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (payload: UpdateCreatePayload) => {
    if (modalMode && modalMode !== "create") {
      await editUpdate(modalMode.id, payload);
    } else {
      await createUpdate(payload);
    }
    setModalMode(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("이 업데이트 공지를 삭제하시겠습니까?")) return;
    try {
      await deleteUpdateByAdmin(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "삭제에 실패했습니다."));
    }
  };

  const handleToggleActive = async (update: UpdateNotice) => {
    try {
      await editUpdate(update.id, { is_active: !update.is_active });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "상태 변경에 실패했습니다."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">업데이트 공지 관리</h3>
        <Button size="sm" onClick={() => setModalMode("create")}>
          + 새 공지 작성
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {!updates && !error && <Spinner label="불러오는 중..." />}

      {updates && updates.length === 0 && (
        <p className="card py-8 text-center text-sm text-gray-400">작성된 업데이트 공지가 없습니다.</p>
      )}

      {updates && updates.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">제목</th>
                <th className="py-2 pr-4">카테고리</th>
                <th className="py-2 pr-4">버전</th>
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">작성일</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{u.title}</td>
                  <td className="py-3 pr-4">{u.category_label}</td>
                  <td className="py-3 pr-4 text-gray-400">{u.version ?? "-"}</td>
                  <td className="py-3 pr-4">
                    <button onClick={() => handleToggleActive(u)}>
                      {u.is_active ? (
                        <Badge tone="success">활성</Badge>
                      ) : (
                        <Badge>비활성</Badge>
                      )}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setModalMode(u)}>
                        수정
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(u.id)}>
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

      {modalMode && (
        <UpdateFormModal
          initial={modalMode === "create" ? undefined : modalMode}
          onClose={() => setModalMode(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
