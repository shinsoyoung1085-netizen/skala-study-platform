import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute, ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminPage } from "@/pages/AdminPage";
import { CurriculumDashboardPage } from "@/pages/CurriculumDashboardPage";
import { HomePage } from "@/pages/HomePage";
import { InformationFeedPage } from "@/pages/InformationFeedPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyPage } from "@/pages/MyPage";
import { MyStudiesPage } from "@/pages/MyStudiesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SignupPage } from "@/pages/SignupPage";
import { StudiesPage } from "@/pages/StudiesPage";
import { StudyDetailPage } from "@/pages/StudyDetailPage";
import { TopicQnaRoomPage } from "@/pages/TopicQnaRoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/studies"
        element={
          <ProtectedRoute>
            <StudiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/studies/:studyId"
        element={
          <ProtectedRoute>
            <StudyDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-studies"
        element={
          <ProtectedRoute>
            <MyStudiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mypage"
        element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/curriculum"
        element={
          <ProtectedRoute>
            <CurriculumDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/curriculum/topics/:topicId"
        element={
          <ProtectedRoute>
            <TopicQnaRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <InformationFeedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
