import { useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/hooks/useAuth";

/** 로그인 후 진입하는 홈 화면. */
export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PageContainer>
      <section className="card flex flex-col gap-4 bg-gradient-to-br from-primary-50 to-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">SKALA STUDY</p>
          <h1 className="mt-1 text-xl font-extrabold text-gray-900">
            {user?.name}님, 오늘도 함께 성장할 동료를 찾아보세요.
          </h1>
        </div>
        <Button onClick={() => navigate("/studies")}>스터디 둘러보기</Button>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          className="card card-hover text-left"
          onClick={() => navigate("/studies?create=1")}
        >
          <h2 className="text-lg font-bold text-gray-900">스터디 만들기</h2>
          <p className="mt-1 text-sm text-gray-500">원하는 스터디가 없다면 직접 개설해보세요.</p>
        </button>

        <button className="card card-hover text-left" onClick={() => navigate("/my-studies")}>
          <h2 className="text-lg font-bold text-gray-900">내 스터디 확인하기</h2>
          <p className="mt-1 text-sm text-gray-500">참여중인 스터디 목록과 상세 정보를 확인하세요.</p>
        </button>
      </div>
    </PageContainer>
  );
}
