import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { findPassword, findUsername } from "@/api/auth";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

type Tab = "username" | "password";

const TAB_LABEL: Record<Tab, string> = {
  username: "아이디 찾기",
  password: "비밀번호 찾기",
};

/** 아이디/비밀번호 찾기 페이지. 이름+SKALA 고유번호+이메일이 모두 일치해야 결과를 알려준다. */
export function FindAccountPage() {
  const [tab, setTab] = useState<Tab>("username");

  const [name, setName] = useState("");
  const [skalaId, setSkalaId] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setFoundUsername(null);
    setTemporaryPassword(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (tab === "username") {
        const res = await findUsername({ name, skala_id: skalaId, email });
        setFoundUsername(res.username);
      } else {
        const res = await findPassword({ username, name, skala_id: skalaId, email });
        setTemporaryPassword(res.temporary_password);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "일치하는 회원 정보를 찾을 수 없습니다."));
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
          <p className="mt-1 text-sm text-gray-500">아이디 또는 비밀번호를 찾아드릴게요.</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
          {(["username", "password"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                tab === t ? "bg-white text-primary shadow-sm" : "text-gray-500"
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        {foundUsername ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">
              회원님의 아이디는 <span className="font-bold">{foundUsername}</span> 입니다.
            </Alert>
            <Link to="/login">
              <Button fullWidth>로그인하러 가기</Button>
            </Link>
          </div>
        ) : temporaryPassword ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">
              임시 비밀번호가 발급되었습니다: <span className="font-bold">{temporaryPassword}</span>
            </Alert>
            <p className="text-xs text-gray-400">
              이 임시 비밀번호로 로그인한 뒤, 마이페이지에서 반드시 비밀번호를 변경해주세요.
            </p>
            <Link to="/login">
              <Button fullWidth>로그인하러 가기</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert>{error}</Alert>}

            {tab === "password" && (
              <Input label="아이디" value={username} onChange={(e) => setUsername(e.target.value)} required />
            )}
            <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="SKALA 고유번호"
              value={skalaId}
              onChange={(e) => setSkalaId(e.target.value)}
              required
            />
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              {TAB_LABEL[tab]}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold text-primary">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
