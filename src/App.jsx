import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }   from '@/context/AuthContext'
import { AdminDataProvider }       from '@/context/AdminDataContext'
import { ProgressProvider }        from '@/context/ProgressContext'
import { SettingsProvider }        from '@/context/SettingsContext'
import Layout           from '@/components/layout/Layout'
import Home             from '@/pages/Home'
import Courses          from '@/pages/Courses'
import CourseDetail     from '@/pages/CourseDetail'
import VideoPlayer      from '@/pages/VideoPlayer'
import Departments      from '@/pages/Departments'
import About            from '@/pages/About'
import Search           from '@/pages/Search'
import Bookmarks        from '@/pages/Bookmarks'
import SettingsPage     from '@/pages/Settings'
import Interviews       from '@/pages/Interviews'
import NotFound         from '@/pages/NotFound'
import AdminLogin       from '@/pages/Admin/Login'
import AdminDashboard   from '@/pages/Admin/Dashboard'
import AdminCourseEditor from '@/pages/Admin/CourseEditor'
import AdminSettings    from '@/pages/Admin/AdminSettings'

function ProtectedAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                                    element={<Home />} />
        <Route path="/courses"                             element={<Courses />} />
        <Route path="/courses/:playlistId"                 element={<CourseDetail />} />
        <Route path="/courses/:playlistId/watch/:videoId"  element={<VideoPlayer />} />
        <Route path="/departments"                         element={<Departments />} />
        <Route path="/departments/:schoolId"               element={<Courses />} />
        <Route path="/departments/:schoolId/:programId"    element={<Courses />} />
        <Route path="/about"                               element={<About />} />
        <Route path="/search"                              element={<Search />} />
        <Route path="/interviews"                          element={<Interviews />} />
        <Route path="/bookmarks"                           element={<Bookmarks />} />
        <Route path="/settings"                            element={<SettingsPage />} />
        <Route path="/admin/login"                         element={<AdminLogin />} />
        <Route path="/admin"                element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
        <Route path="/admin/courses/:playlistId" element={<ProtectedAdmin><AdminCourseEditor /></ProtectedAdmin>} />
        <Route path="/admin/settings"       element={<ProtectedAdmin><AdminSettings /></ProtectedAdmin>} />
        <Route path="*"                                    element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AdminDataProvider>
          <ProgressProvider>
            <AppRoutes />
          </ProgressProvider>
        </AdminDataProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
