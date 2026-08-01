import { useEffect, useRef, useState } from "react";

import { extractErrorMessage } from "@/api/client";
import { linkGoogleAccount } from "@/api/users";
import { Alert } from "@/components/common/Alert";
import { useAuth } from "@/hooks/useAuth";

/** 마이페이지에서 현재 로그인된 계정에 구글 계정을 연동하는 섹션. */
export function LinkGoogleSection() {
  const { user, refreshProfile } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isLinked = user?.google_linked ?? false;

  const handleCredential = async (idToken: string) => {
    setError(null);
    setIsLinking(true);
    try {
      await linkGoogleAccount(idToken);
      await refreshProfile();
      setSuccessMessage("구글 계정이 연동되었습니다.");
    } catch (err) {
      setError(extractErrorMessage(err, "구글 계정 연동에 실패했습니다."));
    } finally {
      setIsLinking(false);
    }
  };

  // GIS 스크립트는 index.html에서 비동기로 로드되므로, 준비될 때까지 짧게 재시도한다.
  useEffect(() => {
    if (!clientId || isLinked) return;

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
          size: "medium",
          width: 240,
          text: "signin_with",
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
  }, [clientId, isLinked]);

  if (!clientId) return null;

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="text-base font-bold text-gray-900">구글 계정 연동</h3>
      {error && <Alert>{error}</Alert>}
      {successMessage && <Alert tone="success">{successMessage}</Alert>}

      {isLinked ? (
        <div className="flex items-center gap-3">
          {user?.picture_url && <img src={user.picture_url} alt="" className="h-10 w-10 rounded-full" />}
          <p className="text-sm text-gray-600">구글 계정으로 연동되어 있어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500">
            구글 계정을 연동하면 아이디/비밀번호 없이도 이 계정으로 로그인할 수 있어요.
          </p>
          <div ref={buttonRef} />
          {isLinking && <p className="text-xs text-gray-400">연동 처리 중...</p>}
        </div>
      )}
    </div>
  );
}
