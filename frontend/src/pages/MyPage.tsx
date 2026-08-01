import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  applyForAdmin,
  changeMyPassword,
  deleteMyAccount,
  fetchMyAdminApplication,
  setMyClass,
  setMyCurriculum,
  updateMyProfile,
  updateMySkills,
} from "@/api/users";
import { checkEmail, checkUsername } from "@/api/auth";
import { clearStoredToken, extractErrorMessage } from "@/api/client";
import { LinkGoogleSection } from "@/components/auth/LinkGoogleSection";
import { Alert } from "@/components/common/Alert";
import { AvailabilityHint } from "@/components/common/AvailabilityHint";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Spinner } from "@/components/common/Spinner";
import { CurriculumPicker } from "@/components/curriculum/CurriculumPicker";
import { SkillEditor } from "@/components/curriculum/SkillEditor";
import { ClassPicker } from "@/components/leaderboard/ClassPicker";
import { StudyTimeSummaryCard } from "@/components/leaderboard/StudyTimeSummaryCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import { INTEREST_LABELS } from "@/constants/interestGroups";
import { useAuth } from "@/hooks/useAuth";
import { useAvailabilityCheck } from "@/hooks/useAvailabilityCheck";
import type { AdminApplication } from "@/types";

/** 마이페이지: 프로필 조회, 계정 정보(아이디/이메일/캠퍼스) 수정, 비밀번호 변경을 제공한다. */
export function MyPage() {
  const { user, refreshProfile } = useAuth();

  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCampus, setEditCampus] = useState("");
  // skipValue: 지금 내 계정의 원래 값 그대로면(안 바꿨으면) 중복 확인을 건너뛴다 - 내 아이디/이메일이 "이미 사용 중"으로 뜨는 걸 방지.
  const usernameCheck = useAvailabilityCheck(checkUsername, { skipValue: user?.username });
  const emailCheck = useAvailabilityCheck(checkEmail, { skipValue: user?.email });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [adminApplication, setAdminApplication] = useState<AdminApplication | null>(null);
  const [applicationReason, setApplicationReason] = useState("");
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // 로그인한 회원 정보가 (처음) 로딩되거나 저장 후 갱신되면 수정 폼 값도 최신 상태로 맞춘다.
  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
      setEditCampus(user.campus);
    }
  }, [user]);

  const loadApplication = useCallback(() => {
    fetchMyAdminApplication()
      .then(setAdminApplication)
      .catch(() => setAdminApplication(null));
  }, []);

  useEffect(() => {
    if (user && !user.is_admin) {
      loadApplication();
    }
  }, [user, loadApplication]);

  if (!user) return <Spinner />;

  const handleApplyForAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setApplicationError(null);
    setIsApplying(true);
    try {
      const application = await applyForAdmin({ reason: applicationReason });
      setAdminApplication(application);
      setApplicationReason("");
    } catch (err) {
      setApplicationError(extractErrorMessage(err, "관리자 신청에 실패했습니다."));
    } finally {
      setIsApplying(false);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (usernameCheck.status === "taken") {
      setProfileError("이미 사용 중인 아이디입니다.");
      return;
    }
    if (emailCheck.status === "taken") {
      setProfileError("이미 사용 중인 이메일입니다.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateMyProfile({ username: editUsername, email: editEmail, campus: editCampus });
      await refreshProfile();
      setProfileSuccess("정보가 저장되었습니다.");
    } catch (err) {
      setProfileError(extractErrorMessage(err, "정보 수정에 실패했습니다."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await changeMyPassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      setPasswordError(extractErrorMessage(err, "비밀번호 변경에 실패했습니다."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!window.confirm("정말 탈퇴하시겠습니까? 개설한 스터디를 포함해 모든 데이터가 삭제되며 되돌릴 수 없습니다.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMyAccount({ password: deletePassword });
      clearStoredToken();
      window.location.href = "/";
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "회원 탈퇴에 실패했습니다."));
      setIsDeleting(false);
    }
  };

  return (
    <PageContainer>
      <h1 className="mb-6 text-xl font-extrabold text-gray-900">마이페이지</h1>

      <div className="flex flex-col gap-6">
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-2xl font-extrabold text-primary">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                {user.is_main_admin && <Badge tone="primary">메인 관리자</Badge>}
                {user.is_admin && !user.is_main_admin && <Badge tone="primary">부관리자</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                {user.username} · SKALA {user.skala_id}
              </p>
              <p className="text-sm text-gray-500">{user.campus_label} 캠퍼스</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">관심분야</h3>
            {user.interests.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 관심분야가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.interests.map((code) => (
                  <Badge key={code} tone="primary">
                    {INTEREST_LABELS[code] ?? code}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">참여중인 스터디</p>
              <p className="mt-1 text-2xl font-extrabold text-primary">{user.joined_study_count}개</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">모임장 추천 포인트</p>
              <p className="mt-1 text-2xl font-extrabold text-primary">{user.points}P</p>
            </div>
          </div>
        </div>

        <StudyTimeSummaryCard />

        <div className="card flex flex-col gap-3">
          <h3 className="text-base font-bold text-gray-900">교육과정</h3>
          {user.curriculum ? (
            <p className="text-sm text-gray-600">
              소속: <span className="font-medium text-gray-900">{user.curriculum.title}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">아직 소속된 교육과정이 없습니다.</p>
          )}
          <CurriculumPicker
            currentCurriculumId={user.curriculum?.id}
            onAssign={async (id) => {
              await setMyCurriculum(id);
              await refreshProfile();
            }}
          />
        </div>

        <div className="card flex flex-col gap-3">
          <h3 className="text-base font-bold text-gray-900">소속 반 (리더보드)</h3>
          {user.study_class ? (
            <p className="text-sm text-gray-600">
              현재: <span className="font-medium text-gray-900">{user.study_class.name}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">아직 소속된 반이 없어요. 반을 선택하면 반/캠퍼스 리더보드에 참여할 수 있어요.</p>
          )}
          <ClassPicker
            currentClassId={user.study_class?.id}
            onAssign={async (classId) => {
              await setMyClass(classId);
              await refreshProfile();
            }}
          />
        </div>

        <div className="card">
          <SkillEditor
            skills={user.skills}
            onSave={async (items) => {
              await updateMySkills(items);
              await refreshProfile();
            }}
          />
        </div>

        <form onSubmit={handleProfileSubmit} className="card flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900">계정 정보 수정</h3>

          {profileError && <Alert>{profileError}</Alert>}
          {profileSuccess && <Alert tone="success">{profileSuccess}</Alert>}

          <div>
            <Input
              label="아이디"
              value={editUsername}
              onChange={(e) => {
                setEditUsername(e.target.value);
                usernameCheck.reset();
              }}
              onBlur={() => usernameCheck.check(editUsername)}
              required
            />
            <AvailabilityHint status={usernameCheck.status} />
          </div>
          <div>
            <Input
              label="이메일"
              type="email"
              value={editEmail}
              onChange={(e) => {
                setEditEmail(e.target.value);
                emailCheck.reset();
              }}
              onBlur={() => emailCheck.check(editEmail)}
              required
            />
            <AvailabilityHint status={emailCheck.status} />
          </div>
          <Select
            label="캠퍼스"
            options={CAMPUS_OPTIONS}
            value={editCampus}
            onChange={(e) => setEditCampus(e.target.value)}
            required
          />

          <Button type="submit" isLoading={isSavingProfile}>
            정보 저장
          </Button>
        </form>

        <LinkGoogleSection />

        <form onSubmit={handlePasswordSubmit} className="card flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900">비밀번호 변경</h3>

          {passwordError && <Alert>{passwordError}</Alert>}
          {passwordSuccess && <Alert tone="success">{passwordSuccess}</Alert>}

          <Input
            label="현재 비밀번호"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="새 비밀번호"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="8자 이상 입력해주세요"
            required
          />
          <Input
            label="새 비밀번호 확인"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
          />

          <Button type="submit" variant="secondary" isLoading={isSavingPassword}>
            비밀번호 변경
          </Button>
        </form>

        {!user.is_admin && (
          <div className="card flex flex-col gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">관리자 신청</h3>
              <p className="mt-1 text-sm text-gray-500">
                신청하시면 메인 관리자의 승인 후 부관리자 권한이 부여됩니다.
              </p>
            </div>

            {applicationError && <Alert>{applicationError}</Alert>}

            {adminApplication?.status === "PENDING" ? (
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <Badge tone="neutral">심사중</Badge>
                <p className="mt-2 whitespace-pre-wrap">{adminApplication.reason || "(사유 없음)"}</p>
              </div>
            ) : (
              <form onSubmit={handleApplyForAdmin} className="flex flex-col gap-4">
                {adminApplication?.status === "REJECTED" && (
                  <Alert tone="info">이전 신청이 거절되었습니다. 다시 신청할 수 있어요.</Alert>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">신청 사유 (선택)</label>
                  <textarea
                    className="min-h-[80px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                    value={applicationReason}
                    onChange={(e) => setApplicationReason(e.target.value)}
                    placeholder="스터디 운영을 돕고 싶은 이유 등을 적어주세요"
                  />
                </div>
                <Button type="submit" variant="outline" isLoading={isApplying}>
                  관리자 신청하기
                </Button>
              </form>
            )}
          </div>
        )}

        <div className="card flex flex-col gap-4 border-red-100">
          <div>
            <h3 className="text-base font-bold text-red-600">회원 탈퇴</h3>
            <p className="mt-1 text-sm text-gray-500">
              탈퇴하면 개설한 스터디를 포함한 모든 정보가 삭제되며 되돌릴 수 없습니다.
            </p>
          </div>

          {user.is_admin ? (
            <p className="text-sm text-gray-400">관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 문의해주세요.</p>
          ) : (
            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
              {deleteError && <Alert>{deleteError}</Alert>}

              <Input
                label="비밀번호 확인"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />

              <Button type="submit" variant="danger" isLoading={isDeleting}>
                회원 탈퇴하기
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
