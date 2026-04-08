import { Link } from 'react-router-dom'
import { usePlaylists } from '@/hooks/useYouTube'
import CourseCard from '@/components/ui/CourseCard'
import { CourseCardSkeleton } from '@/components/ui/LoadingSpinner'

export default function FeaturedCourses() {
  const { data, isLoading, isError } = usePlaylists()

  const courses = data?.pages?.[0]?.items?.slice(0, 6) ?? []

  return (
    <section className="py-16">
      <div className="section">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-zc-gold text-sm font-semibold font-body uppercase tracking-widest mb-1">
              Open CourseWare
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-zc-navy">
              Latest Courses
            </h2>
          </div>
          <Link to="/courses" className="btn-ghost hidden sm:inline-flex">
            All courses →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : isError
            ? <p className="col-span-3 text-center text-zc-gray py-12">
                Could not load courses. Check your YouTube API key.
              </p>
            : courses.map(course => (
                <CourseCard key={course.id} playlist={course} />
              ))
          }
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link to="/courses" className="btn-outline">View all courses</Link>
        </div>
      </div>
    </section>
  )
}
