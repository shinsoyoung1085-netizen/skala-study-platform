import { useCallback, useEffect, useState } from "react";

import {
  deleteStudyByAdmin,
  deleteUserByAdmin,
  fetchAllStudiesForAdmin,
  fetchAllUsers,
} from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { AdminApplicationsPanel } from "@/components/admin/AdminApplicationsPanel";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { ClassManagementPanel } from "@/components/admin/ClassManagementPanel";
import { CurriculumManagementPanel } from "@/components/admin/CurriculumManagementPanel";
import { LeaderPointsPanel } from "@/components/admin/LeaderPointsPanel";
import { UpdateManagementPanel } from "@/components/admin/UpdateManagementPanel";
import { UsageAnalyticsPanel } from "@/components/admin/UsageAnalyticsPanel";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import type { AdminUser, Study } from "@/types";

type Tab =
  | "users"
  | "studies"
  | "points"
  | "updates"
  | "applications"
  | "curricula"
  | "classes"
  | "analytics";

/** 관리자 전용 페이지: 회원/스터디 목록 조회 및 삭제 기능만 제공한다. */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userList, studyList] = await Promise.all([fetchAllUsers(), fetchAllStudiesForAdmin()]);
      setUsers(userList);
      setStudies(studyList.items);
    } catch (err) {
      setError(extractErrorMessage(err, "관리자 데이터를 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("이 회원을 삭제하시겠습니까?")) return;
    try {
      await deleteUserByAdmin(userId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "회원 삭제에 실패했습니다."));
    }
  };

  const handleDeleteStudy = async (studyId: number) => {
    if (!window.confirm("이 스터디를 삭제하시겠습니까?")) return;
    try {
      await deleteStudyByAdmin(studyId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 삭제에 실패했습니다."));
    }
  };

  return (
    <PageContainer>
      <h1 className="mb-6 text-xl font-extrabold text-gray-900">관리자</h1>

      {!isLoading && !error && <AnalyticsDashboard users={users} studies={studies} />}

      <div className="mb-6 flex gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "users" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("users")}
        >
          회원 목록
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "studies" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("studies")}
        >
          스터디 목록
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "points" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("points")}
        >
          리더 포인트
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "updates" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("updates")}
        >
          업데이트 관리
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "applications" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("applications")}
        >
          관리자 신청
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "curricula" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("curricula")}
        >
          교육과정
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "classes" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("classes")}
        >
          반 관리
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            tab === "analytics" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTab("analytics")}
        >
          이용 분석
        </button>
      </div>

      {error && <Alert>{error}</Alert>}
      {isLoading && <Spinner />}

      {!isLoading && tab === "users" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">이름</th>
                <th className="py-2 pr-4">아이디</th>
                <th className="py-2 pr-4">이메일</th>
                <th className="py-2 pr-4">SKALA 고유번호</th>
                <th className="py-2 pr-4">캠퍼스</th>
                <th className="py-2 pr-4">권한</th>
                <th className="py-2 pr-4">포인트</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4">{u.name}</td>
                  <td className="py-3 pr-4">{u.username}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">{u.skala_id}</td>
                  <td className="py-3 pr-4">{u.campus_label}</td>
                  <td className="py-3 pr-4">
                    {u.is_main_admin ? (
                      <Badge tone="primary">메인 관리자</Badge>
                    ) : u.is_admin ? (
                      <Badge tone="primary">부관리자</Badge>
                    ) : (
                      <Badge>일반회원</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4">{u.points}P</td>
                  <td className="py-3">
                    {!u.is_main_admin && (
                      <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id)}>
                        삭제
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && tab === "studies" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 pr-4">스터디명</th>
                <th className="py-2 pr-4">카테고리</th>
                <th className="py-2 pr-4">캠퍼스</th>
                <th className="py-2 pr-4">개설자</th>
                <th className="py-2 pr-4">인원</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {studies.map((s) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4">{s.name}</td>
                  <td className="py-3 pr-4">{s.category_label}</td>
                  <td className="py-3 pr-4">{s.campus_label}</td>
                  <td className="py-3 pr-4">{s.creator.name}</td>
                  <td className="py-3 pr-4">
                    {s.current_member_count} / {s.capacity}
                  </td>
                  <td className="py-3">
                    <Button variant="danger" size="sm" onClick={() => handleDeleteStudy(s.id)}>
                      삭제
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && tab === "points" && <LeaderPointsPanel users={users} />}

      {!isLoading && tab === "updates" && <UpdateManagementPanel />}

      {!isLoading && tab === "applications" && <AdminApplicationsPanel />}

      {!isLoading && tab === "curricula" && <CurriculumManagementPanel />}

      {!isLoading && tab === "classes" && <ClassManagementPanel />}

      {!isLoading && tab === "analytics" && <UsageAnalyticsPanel />}
    </PageContainer>
  );
}
