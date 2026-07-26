import { useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";

/** 로그인하지 않은 사용자가 처음 마주하는 첫 화면. */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            SKALA <span className="text-primary">STUDY</span>
          </h1>
          <p className="text-base font-medium text-gray-500 sm:text-lg">너, 내 동료가 돼라.</p>
        </div>

        <p className="max-w-sm text-lg font-semibold leading-relaxed text-gray-800 sm:text-xl">
          혼자 공부하지 말고
          <br />
          함께 성장하는 동료를 만나보세요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" fullWidth onClick={() => navigate("/login")}>
          로그인
        </Button>
        <Button size="lg" fullWidth variant="outline" onClick={() => navigate("/signup")}>
          회원가입
        </Button>
      </div>
    </div>
  );
}
