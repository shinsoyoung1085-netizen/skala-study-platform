import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { extractErrorMessage } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";

/** 로그인 페이지. "로그인 유지" 체크 여부에 따라 토큰 저장 위치가 달라진다. */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username, password, remember_me: rememberMe });
      navigate("/home", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900">
            SKALA <span className="text-primary">STUDY</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">너, 내 동료가 돼라.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}

          <Input
            id="username"
            label="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="아이디를 입력하세요"
            required
          />
          <Input
            id="password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            로그인 유지
          </label>

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            로그인
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-100" />
          또는
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <GoogleAuthSection onSuccess={() => navigate("/home", { replace: true })} />

        <p className="mt-6 text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup" className="font-semibold text-primary">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
