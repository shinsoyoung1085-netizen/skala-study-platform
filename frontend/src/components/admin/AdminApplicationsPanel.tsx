import { useCallback, useEffect, useState } from "react";

import {
  approveAdminApplication,
  fetchAdminApplications,
  rejectAdminApplication,
} from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import type { AdminApplicationAdminItem } from "@/types";

const STATUS_TONE: Record<string, "neutral" | "success" | "danger"> = {
  PENDING: "neutral",
  APPROVED: "success",
  REJECTED: "danger",
};

/** 관리자 "관리자 신청" 탭: 신청 목록 조회는 모든 관리자, 승인/거절은 메인 관리자만 가능하다. */
export function AdminApplicationsPanel() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AdminApplicationAdminItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchAdminApplications();
      setApplications(list);
    } catch (err) {
      setError(extractErrorMessage(err, "신청 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: number) => {
    setActingId(id);
    try {
      await approveAdminApplication(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "승인에 실패했습니다."));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingId(id);
    try {
      await rejectAdminApplication(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "거절에 실패했습니다."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-gray-900">관리자 신청 목록</h3>

      {!user?.is_main_admin && (
        <Alert tone="info">승인/거절은 메인 관리자만 할 수 있어요. 조회만 가능합니다.</Alert>
      )}
      {error && <Alert>{error}</Alert>}
      {!applications && !error && <Spinner label="불러오는 중..." />}

      {applications && applications.length === 0 && (
        <p className="card py-8 text-center text-sm text-gray-400">신청 내역이 없습니다.</p>
      )}

      {applications && applications.length > 0 && (
        <div className="flex flex-col gap-3">
          {applications.map((app) => (
            <div key={app.id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {app.applicant_name} <span className="font-normal text-gray-400">({app.applicant_username})</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {app.reason || "(사유 없음)"}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[app.status] ?? "neutral"}>{app.status_label}</Badge>
              </div>

              <p className="text-xs text-gray-400">
                신청일 {new Date(app.created_at).toLocaleString("ko-KR")}
                {app.reviewed_at && (
                  <>
                    {" "}
                    · 처리일 {new Date(app.reviewed_at).toLocaleString("ko-KR")}
                    {app.reviewed_by_name && ` (${app.reviewed_by_name})`}
                  </>
                )}
              </p>

              {app.status === "PENDING" && user?.is_main_admin && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" isLoading={actingId === app.id} onClick={() => handleApprove(app.id)}>
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={actingId === app.id}
                    onClick={() => handleReject(app.id)}
                  >
                    거절
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
