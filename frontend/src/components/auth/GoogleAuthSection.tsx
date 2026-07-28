import { useEffect, useRef, useState, type FormEvent } from "react";

import { completeGoogleSignup, googleLogin } from "@/api/auth";
import { extractErrorMessage, storeToken } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import { INTEREST_GROUPS } from "@/constants/interestGroups";
import { useAuth } from "@/hooks/useAuth";

interface GoogleAuthSectionProps {
  /** 로그인/가입이 끝난 뒤 호출된다 (보통 /home으로 이동시키는 용도). */
  onSuccess: () => void;
}

interface PendingProfile {
  pendingToken: string;
  email: string;
  name: string;
  picture: string | null;
}

/**
 * "Google로 계속하기" 버튼 + (신규 가입자인 경우) SKALA 고유번호/캠퍼스 입력 폼을 한 번에 처리하는 컴포넌트.
 * 로그인 페이지, 회원가입 페이지 어디에 넣어도 동일하게 동작한다.
 */
export function GoogleAuthSection({ onSuccess }: GoogleAuthSectionProps) {
  const { refreshProfile } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingProfile | null>(null);
  const [skalaId, setSkalaId] = useState("");
  const [campus, setCampus] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredential = async (idToken: string) => {
    setError(null);
    try {
      const res = await googleLogin(idToken);
      if (res.needs_profile_completion) {
        setPending({
          pendingToken: res.pending_token!,
          email: res.email ?? "",
          name: res.name ?? "",
          picture: res.picture,
        });
        return;
      }
      storeToken(res.access_token!, true);
      await refreshProfile();
      onSuccess();
    } catch (err) {
      setError(extractErrorMessage(err, "Google 로그인에 실패했습니다."));
    }
  };

  // GIS 스크립트는 index.html에서 비동기로 로드되므로, 준비될 때까지 짧게 재시도한다.
  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handleCredential(response.credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
        return;
      }
      setTimeout(tryRender, 150);
    };
    tryRender();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const toggleInterest = (code: string, checked: boolean) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const handleCompleteSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!campus) {
      setError("캠퍼스를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await completeGoogleSignup({
        pending_token: pending!.pendingToken,
        skala_id: skalaId,
        campus,
        interests: Array.from(interests),
      });
      storeToken(accessToken, true);
      await refreshProfile();
      onSuccess();
    } catch (err) {
      setError(extractErrorMessage(err, "가입 완료에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clientId) {
    return null; // Google 로그인 설정(VITE_GOOGLE_CLIENT_ID)이 안 되어 있으면 조용히 숨긴다.
  }

  if (pending) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          {pending.picture && (
            <img src={pending.picture} alt="" className="h-10 w-10 rounded-full" />
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{pending.name}</p>
            <p className="text-xs text-gray-500">{pending.email}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">SKALA STUDY가 처음이시네요! 가입을 마무리하려면 아래 정보를 입력해주세요.</p>

        {error && <Alert>{error}</Alert>}

        <form onSubmit={handleCompleteSignup} className="flex flex-col gap-3">
          <Input
            label="SKALA 고유번호"
            value={skalaId}
            onChange={(e) => setSkalaId(e.target.value)}
            required
          />
          <Select
            label="캠퍼스"
            options={CAMPUS_OPTIONS}
            placeholder="캠퍼스를 선택하세요"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            required
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">관심분야 (복수 선택 가능)</label>
            {INTEREST_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-1.5">
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
            가입 완료
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {error && <Alert>{error}</Alert>}
      <div ref={buttonRef} />
    </div>
  );
}
