import { useCallback, useEffect, useState } from "react";

import { fetchTopics } from "@/api/curricula";
import { extractErrorMessage } from "@/api/client";
import { setMyCurriculum } from "@/api/users";
import { Alert } from "@/components/common/Alert";
import { Spinner } from "@/components/common/Spinner";
import { CurriculumPicker } from "@/components/curriculum/CurriculumPicker";
import { TopicCard } from "@/components/curriculum/TopicCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/useAuth";
import type { Topic } from "@/types";

/** 교육과정 대시보드: 소속 교육과정의 단원(Topic) 목록을 카드로 보여준다. */
export function CurriculumDashboardPage() {
  const { user, refreshProfile } = useAuth();

  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.curriculum) return;
    setError(null);
    try {
      const res = await fetchTopics(user.curriculum.id);
      setTopics(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "단원 목록을 불러오지 못했습니다."));
    }
  }, [user?.curriculum]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return <Spinner />;

  if (!user.curriculum) {
    return (
      <PageContainer>
        <h1 className="mb-6 text-xl font-extrabold text-gray-900">교육과정</h1>
        <div className="card flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            아직 소속된 교육과정이 없어요. 먼저 교육과정을 선택해주세요.
          </p>
          <CurriculumPicker
            onAssign={async (id) => {
              await setMyCurriculum(id);
              await refreshProfile();
            }}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-xl font-extrabold text-gray-900">{user.curriculum.title}</h1>
      <p className="mb-6 text-sm text-gray-500">단원을 선택해 질문/답변을 나눠보세요.</p>

      {error && <Alert>{error}</Alert>}
      {!topics && !error && <Spinner />}

      {topics && topics.length === 0 && (
        <p className="card py-10 text-center text-sm text-gray-400">아직 등록된 단원이 없습니다.</p>
      )}

      {topics && topics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
