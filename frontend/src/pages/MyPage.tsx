import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import { INTEREST_LABELS } from "@/constants/interestGroups";
import { useAuth } from "@/hooks/useAuth";

/** 마이페이지: 이름, 관심분야, 참여중인 스터디 개수를 보여준다. */
export function MyPage() {
  const { user } = useAuth();

  if (!user) return <Spinner />;

  return (
    <PageContainer>
      <h1 className="mb-6 text-xl font-extrabold text-gray-900">마이페이지</h1>

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
    </PageContainer>
  );
}
