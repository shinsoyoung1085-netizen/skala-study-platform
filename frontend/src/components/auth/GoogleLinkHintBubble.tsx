import { useState } from "react";

import { dismissGoogleLinkHint, shouldShowGoogleLinkHint } from "@/utils/googleLinkPromptStorage";

/**
 * 로그인 페이지의 Google 로그인 버튼 위에 뜨는 안내 말풍선.
 * 기존 아이디/비밀번호 계정이 있는 사용자가 구글로 로그인해서 중복 계정을 만들지 않도록,
 * 마이페이지에서 연동하는 방법을 안내한다. 한 번 닫으면 이 브라우저에서는 다시 뜨지 않는다.
 */
export function GoogleLinkHintBubble() {
  const [visible, setVisible] = useState(shouldShowGoogleLinkHint);

  if (!visible) return null;

  const handleClose = () => {
    dismissGoogleLinkHint();
    setVisible(false);
  };

  return (
    <div className="relative mx-auto mb-4 w-full max-w-[320px] animate-fade-in">
      <div className="relative rounded-2xl border border-primary-200 bg-white px-4 py-3 shadow-lg">
        <button
          type="button"
          onClick={handleClose}
          aria-label="안내 닫기"
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>

        <p className="pr-5 text-sm font-bold text-gray-900">💡 기존 계정과 연동하고 싶으신가요?</p>
        <p className="mt-1 pr-1 text-xs leading-relaxed text-gray-600">
          일반 로그인 후 <span className="font-semibold text-primary">마이페이지</span>에서 구글 계정을 연동해
          주세요!
        </p>

        {/* 아래쪽 Google 버튼을 가리키는 화살표 */}
        <div className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b border-r border-primary-200 bg-white" />
      </div>
    </div>
  );
}
