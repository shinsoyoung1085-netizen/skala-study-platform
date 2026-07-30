import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudyTimerProvider } from "@/contexts/StudyTimerContext";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StudyTimerProvider>
          <App />
        </StudyTimerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
