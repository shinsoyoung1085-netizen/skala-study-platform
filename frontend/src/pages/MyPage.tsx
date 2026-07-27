import { useEffect, useState, type FormEvent } from "react";

import { changeMyPassword, updateMyProfile } from "@/api/users";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import { INTEREST_LABELS } from "@/constants/interestGroups";
import { useAuth } from "@/hooks/useAuth";

/** 마이페이지: 프로필 조회, 계정 정보(아이디/이메일/캠퍼스) 수정, 비밀번호 변경을 제공한다. */
export function MyPage() {
  const { user, refreshProfile } = useAuth();

  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCampus, setEditCampus] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // 로그인한 회원 정보가 (처음) 로딩되거나 저장 후 갱신되면 수정 폼 값도 최신 상태로 맞춘다.
  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditEmail(user.email);
      setEditCampus(user.campus);
    }
  }, [user]);

  if (!user) return <Spinner />;

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
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
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
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

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">참여중인 스터디</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{user.joined_study_count}개</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="card flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900">계정 정보 수정</h3>

          {profileError && <Alert>{profileError}</Alert>}
          {profileSuccess && <Alert tone="success">{profileSuccess}</Alert>}

          <Input
            label="아이디"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            required
          />
          <Input
            label="이메일"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />
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
      </div>
    </PageContainer>
  );
}
