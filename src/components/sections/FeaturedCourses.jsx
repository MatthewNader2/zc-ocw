import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePlaylists } from "@/hooks/useYouTube";
import CourseCard from "@/components/ui/CourseCard";
import { CourseCardSkeleton } from "@/components/ui/LoadingSpinner";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getPlaylistCategory } from "@/data/profileHelpers";
import { useEditablePage } from "@/hooks/useEditablePage";
import { DEFAULT_SITE_SETTINGS } from "@/data/siteSettings";
import ParticleBackground from "@/components/ui/ParticleBackground";
import InlineEditable from "@/components/ui/InlineEditable";

export default function FeaturedCourses() {
  const { data, isLoading, isError } = usePlaylists();
  const { content: siteContent } = useEditablePage("site_settings", DEFAULT_SITE_SETTINGS);

  const title = siteContent?.featuredCoursesTitle || DEFAULT_SITE_SETTINGS.featuredCoursesTitle;
  const category = siteContent?.featuredCoursesCategory || DEFAULT_SITE_SETTINGS.featuredCoursesCategory;

  const courses =
    data?.pages?.[0]?.items
      ?.filter((c) => getPlaylistCategory(c.id) === "course")
      .slice(0, 6) ?? [];
  return (
    <section className="py-20 relative overflow-hidden">
      <ParticleBackground mode="classic" />
      <div className="section relative z-10">
        <ScrollReveal className="flex items-end justify-between mb-12">
          <div>
            <InlineEditable
              page="site_settings"
              field="featuredCoursesCategory"
              value={category}
              defaultContent={DEFAULT_SITE_SETTINGS}
              label="Section Category"
            >
              <p className="text-ocean-500 text-xs font-semibold font-mono uppercase tracking-[0.2em] mb-3">
                {category}
              </p>
            </InlineEditable>
            <InlineEditable
              page="site_settings"
              field="featuredCoursesTitle"
              value={title}
              defaultContent={DEFAULT_SITE_SETTINGS}
              label="Section Title"
            >
              <h2 className="font-display text-4xl md:text-5xl text-ink dark:text-white font-bold">
                {title}
              </h2>
            </InlineEditable>
          </div>
          <Link
            to="/courses"
            className="btn-ghost hidden sm:inline-flex gap-1.5"
          >
            All courses <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          ) : isError ? (
            <p className="col-span-3 text-center text-ink-ghost py-16">
              Could not load courses. Check your YouTube API key in .env
            </p>
          ) : (
            courses.map((c, i) => (
              <ScrollReveal key={c.id} delay={`${i * 0.08}s`}>
                <CourseCard playlist={c} className="h-full" />
              </ScrollReveal>
            ))
          )}
        </div>
        <div className="text-center mt-10 sm:hidden">
          <Link to="/courses" className="btn-outline">
            View all courses
          </Link>
        </div>
      </div>
    </section>
  );
}
