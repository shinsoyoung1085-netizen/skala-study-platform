import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { checkEmail, checkSkalaId, checkUsername, signup } from "@/api/auth";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import { INTEREST_GROUPS } from "@/constants/interestGroups";

type AvailabilityState = "idle" | "checking" | "available" | "taken";

interface DuplicateField {
  value: string;
  status: AvailabilityState;
}

const INITIAL_DUPLICATE_FIELD: DuplicateField = { value: "", status: "idle" };

/** 회원가입 페이지. 아이디/이메일/SKALA 고유번호는 blur 시점에 중복 확인을 수행한다. */
export function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState<DuplicateField>(INITIAL_DUPLICATE_FIELD);
  const [email, setEmail] = useState<DuplicateField>(INITIAL_DUPLICATE_FIELD);
  const [skalaId, setSkalaId] = useState<DuplicateField>(INITIAL_DUPLICATE_FIELD);
  const [campus, setCampus] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());

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

  const runDuplicateCheck = async (
    field: DuplicateField,
    setField: (updater: (prev: DuplicateField) => DuplicateField) => void,
    checker: (value: string) => Promise<boolean>,
  ) => {
    const valueAtRequestTime = field.value;
    if (!valueAtRequestTime) return;

    setField((prev) => ({ ...prev, status: "checking" }));
    try {
      const available = await checker(valueAtRequestTime);
      // 응답이 늦게 도착했을 때, 그 사이 사용자가 값을 바꿨다면 오래된 응답으로 최신 상태를 덮어쓰지 않는다.
      setField((prev) =>
        prev.value === valueAtRequestTime
          ? { value: valueAtRequestTime, status: available ? "available" : "taken" }
          : prev,
      );
    } catch {
      setField((prev) => (prev.value === valueAtRequestTime ? { ...prev, status: "idle" } : prev));
    }
  };

  const renderAvailability = (status: AvailabilityState) => {
    if (status === "checking") return <span className="text-xs text-gray-400">확인 중...</span>;
    if (status === "available") return <span className="text-xs text-green-600">사용 가능합니다</span>;
    if (status === "taken") return <span className="text-xs text-red-500">이미 사용 중입니다</span>;
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.status !== "available") {
      setError("아이디 중복 확인을 완료해주세요.");
      return;
    }
    if (email.status !== "available") {
      setError("이메일 중복 확인을 완료해주세요.");
      return;
    }
    if (skalaId.status !== "available") {
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
        username: username.value,
        email: email.value,
        password,
        skala_id: skalaId.value,
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
              value={username.value}
              onChange={(e) => setUsername({ value: e.target.value, status: "idle" })}
              onBlur={() => runDuplicateCheck(username, setUsername, checkUsername)}
              placeholder="영문, 숫자, 밑줄(_) 사용 가능"
              required
            />
            {renderAvailability(username.status)}
          </div>

          <div>
            <Input
              label="이메일"
              type="email"
              value={email.value}
              onChange={(e) => setEmail({ value: e.target.value, status: "idle" })}
              onBlur={() => runDuplicateCheck(email, setEmail, checkEmail)}
              required
            />
            {renderAvailability(email.status)}
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
              value={skalaId.value}
              onChange={(e) => setSkalaId({ value: e.target.value, status: "idle" })}
              onBlur={() => runDuplicateCheck(skalaId, setSkalaId, checkSkalaId)}
              required
            />
            {renderAvailability(skalaId.status)}
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
