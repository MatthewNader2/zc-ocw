import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Courses from '@/pages/Courses'
import CourseDetail from '@/pages/CourseDetail'
import VideoPlayer from '@/pages/VideoPlayer'
import Departments from '@/pages/Departments'
import About from '@/pages/About'
import Search from '@/pages/Search'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"                         element={<Home />} />
        <Route path="/courses"                  element={<Courses />} />
        <Route path="/courses/:playlistId"      element={<CourseDetail />} />
        <Route path="/courses/:playlistId/watch/:videoId" element={<VideoPlayer />} />
        <Route path="/departments"              element={<Departments />} />
        <Route path="/departments/:slug"        element={<Courses />} />
        <Route path="/about"                    element={<About />} />
        <Route path="/search"                   element={<Search />} />
        <Route path="*"                         element={<NotFound />} />
      </Route>
    </Routes>
  )
}
