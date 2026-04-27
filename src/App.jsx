import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { ProgressProvider } from "@/context/ProgressContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import VideoPlayer from "@/pages/VideoPlayer";
import Departments from "@/pages/Departments";
import About from "@/pages/About";
import Search from "@/pages/Search";
import Bookmarks from "@/pages/Bookmarks";
import SettingsPage from "@/pages/Settings";
import Interviews from "@/pages/Interviews";
import ReportBug from "@/pages/ReportBug";
import ContactUs from "@/pages/ContactUs";
import Acknowledgments from "@/pages/Acknowledgments";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/Admin/Login";

const AdminDashboard = lazy(() => import("@/pages/Admin/Dashboard"));
const AdminCourseEditor = lazy(() => import("@/pages/Admin/CourseEditor"));
const AdminSettings = lazy(() => import("@/pages/Admin/AdminSettings"));

function ProtectedAdmin({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:playlistId" element={<CourseDetail />} />
        <Route
          path="/courses/:playlistId/watch/:videoId"
          element={<VideoPlayer />}
        />
        <Route path="/departments" element={<Departments />} />
        <Route path="/departments/:schoolId" element={<Courses />} />
        <Route path="/departments/:schoolId/:programId" element={<Courses />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/report-bug" element={<ReportBug />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/acknowledgments" element={<Acknowledgments />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <Suspense
                fallback={
                  <div className="p-10 text-center text-ink-muted">
                    Loading…
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
            </ProtectedAdmin>
          }
        />
        <Route
          path="/admin/courses/:playlistId"
          element={
            <ProtectedAdmin>
              <Suspense
                fallback={
                  <div className="p-10 text-center text-ink-muted">
                    Loading…
                  </div>
                }
              >
                <AdminCourseEditor />
              </Suspense>
            </ProtectedAdmin>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdmin>
              <Suspense
                fallback={
                  <div className="p-10 text-center text-ink-muted">
                    Loading…
                  </div>
                }
              >
                <AdminSettings />
              </Suspense>
            </ProtectedAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AdminDataProvider>
            <ProgressProvider>
              <AppRoutes />
            </ProgressProvider>
          </AdminDataProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
