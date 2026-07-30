import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { checkEmail, checkSkalaId, checkUsername, signup } from "@/api/auth";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { AvailabilityHint } from "@/components/common/AvailabilityHint";
import { Button } from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import { INTEREST_GROUPS } from "@/constants/interestGroups";
import { useAvailabilityCheck } from "@/hooks/useAvailabilityCheck";

/** 회원가입 페이지. 아이디/이메일/SKALA 고유번호는 blur 시점에 중복 확인을 수행한다. */
export function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [skalaId, setSkalaId] = useState("");
  const [campus, setCampus] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());

  const usernameCheck = useAvailabilityCheck(checkUsername);
  const emailCheck = useAvailabilityCheck(checkEmail);
  const skalaIdCheck = useAvailabilityCheck(checkSkalaId);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (code: string, checked: boolean) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (usernameCheck.status !== "available") {
      setError("아이디 중복 확인을 완료해주세요.");
      return;
    }
    if (emailCheck.status !== "available") {
      setError("이메일 중복 확인을 완료해주세요.");
      return;
    }
    if (skalaIdCheck.status !== "available") {
      setError("SKALA 고유번호 중복 확인을 완료해주세요.");
      return;
    }
    if (!campus) {
      setError("캠퍼스를 선택해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name,
        username,
        email,
        password,
        skala_id: skalaId,
        campus,
        interests: Array.from(interests),
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "회원가입에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900">
            SKALA <span className="text-primary">STUDY</span> 회원가입
          </h1>
          <p className="mt-1 text-sm text-gray-500">SKALA 교육생만 가입할 수 있어요.</p>
        </div>

        <GoogleAuthSection onSuccess={() => navigate("/home", { replace: true })} />

        <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-100" />
          또는 아이디로 가입
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}

          <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} required />

          <div>
            <Input
              label="아이디"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                usernameCheck.reset();
              }}
              onBlur={() => usernameCheck.check(username)}
              placeholder="영문, 숫자, 밑줄(_) 사용 가능"
              required
            />
            <AvailabilityHint status={usernameCheck.status} />
          </div>

          <div>
            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                emailCheck.reset();
              }}
              onBlur={() => emailCheck.check(email)}
              required
            />
            <AvailabilityHint status={emailCheck.status} />
          </div>

          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="8자 이상 입력해주세요"
            required
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />

          <div>
            <Input
              label="SKALA 고유번호"
              value={skalaId}
              onChange={(e) => {
                setSkalaId(e.target.value);
                skalaIdCheck.reset();
              }}
              onBlur={() => skalaIdCheck.check(skalaId)}
              required
            />
            <AvailabilityHint status={skalaIdCheck.status} />
          </div>

          <Select
            label="캠퍼스"
            options={CAMPUS_OPTIONS}
            placeholder="캠퍼스를 선택하세요"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            required
          />

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">관심분야 (복수 선택 가능)</label>
            {INTEREST_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400">{group.title}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Checkbox
                      key={item.code}
                      label={item.label}
                      checked={interests.has(item.code)}
                      onChange={(checked) => toggleInterest(item.code, checked)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-semibold text-primary">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
