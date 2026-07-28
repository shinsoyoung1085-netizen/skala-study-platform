// Google Identity Services("Sign in with Google" 버튼) 전역 스크립트의 최소 타입 선언.
// 실제 API는 훨씬 넓지만, 여기서는 우리가 실제로 쓰는 부분만 선언한다.
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      width?: string | number;
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    },
  ) => void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}
