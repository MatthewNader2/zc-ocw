import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { ProgressProvider } from "@/context/ProgressContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const VideoPlayer = lazy(() => import("@/pages/VideoPlayer"));
const Departments = lazy(() => import("@/pages/Departments"));
const About = lazy(() => import("@/pages/About"));
const Search = lazy(() => import("@/pages/Search"));
const Bookmarks = lazy(() => import("@/pages/Bookmarks"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const Interviews = lazy(() => import("@/pages/Interviews"));
const ReportBug = lazy(() => import("@/pages/ReportBug"));
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const Acknowledgments = lazy(() => import("@/pages/Acknowledgments"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminLogin = lazy(() => import("@/pages/Admin/Login"));
const FeedbackViewer = lazy(() => import("@/pages/Admin/FeedbackViewer"));
const AdminDashboard = lazy(() => import("@/pages/Admin/Dashboard"));
const AdminCourseEditor = lazy(() => import("@/pages/Admin/CourseEditor"));
const AdminSettings = lazy(() => import("@/pages/Admin/AdminSettings"));

function ProtectedAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null; // brief — avoids flashing a redirect before the role check resolves
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="py-20 flex items-center justify-center"><LoadingSpinner /></div>}>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:playlistId" element={<CourseDetail />} />
        <Route
          path="/courses/:playlistId/watch/:videoId"
          element={
            <ErrorBoundary title="Player Error">
              <VideoPlayer />
            </ErrorBoundary>
          }
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
              <ErrorBoundary title="Admin Dashboard Error">
                <Suspense
                  fallback={
                    <div className="p-10 text-center text-ink-muted">
                      Loading…
                    </div>
                  }
                >
                  <AdminDashboard />
                </Suspense>
              </ErrorBoundary>
            </ProtectedAdmin>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <ProtectedAdmin>
              <FeedbackViewer />
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
    </Suspense>
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
