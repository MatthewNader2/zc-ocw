import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ChevronRight,
  Play,
  User,
  Calendar,
  BookOpen,
  Tag,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useCourse, useLectures } from "@/hooks/useYouTube";
import { getThumbnail } from "@/services/youtube";
import autoProfiles from "@/data/auto-profiles.json";
import { detectFromTitle, getSchool } from "@/data/coursesCatalog";
import { useAdminData } from "@/context/AdminDataContext";
import { useProgress } from "@/context/ProgressContext";
import VideoCard from "@/components/ui/VideoCard";
import MaterialsPanel from "@/components/ui/MaterialsPanel";
import TagBadge from "@/components/ui/TagBadge";
import BookmarkButton from "@/components/ui/BookmarkButton";
import { PageLoader, VideoCardSkeleton } from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import clsx from "clsx";

const ACCENT = {
  csai: "#0096c7",
  business: "#0d9488",
  science: "#7c3aed",
  engineering: "#ea580c",
  general: "#64748b",
};

export default function CourseDetail() {
  const { playlistId } = useParams();
  const { data: course, isLoading: cl, isError: ce } = useCourse(playlistId);
  const {
    data: lectures,
    isLoading: ll,
    isError: le,
  } = useLectures(playlistId);
  const { getCourseData } = useAdminData();
  const { getCourseProgress } = useProgress();

  if (cl) return <PageLoader />;
  if (ce || !course) return <ErrorMessage title="Course not found" />;

  const { snippet, contentDetails } = course;
  const override = getCourseData(playlistId);
  const auto = detectFromTitle(snippet.title);
  const profilerData =
    autoProfiles.results?.find((r) => r.playlistId === playlistId)?.suggested ||
    {};

  // 🔥 Changed ?? to ||
  const schoolId =
    override.schoolId || profilerData.schoolId || auto?.schoolId || "general";
  const school = getSchool(schoolId);
  const tags = override.tags?.length ? override.tags : auto?.tags || [];

  const instructor =
    override.instructor || profilerData.instructor || auto?.instructor || null;
  const semester = override.semester || null;
  const level = override.level || null;
  const courseCode =
    override.courseCode || profilerData.courseCode || auto?.code || null;
  const description = override.description || snippet.description || "";
  const accent = ACCENT[schoolId] ?? ACCENT.general;

  const lectureIds =
    lectures
      ?.map((l) => l.contentDetails?.videoId || l.snippet?.resourceId?.videoId)
      .filter(Boolean) ?? [];
  const progress = getCourseProgress(lectureIds);
  const firstId = lectureIds[0];

  return (
    <>
      <Helmet>
        <title>{snippet.title} — ZC OCW</title>
        <meta name="description" content={description?.slice(0, 160)} />
      </Helmet>

      {/* Thin accent line */}
      <div className="h-1" style={{ background: accent }} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-800">
        <div className="section py-12 md:py-16">
          {/* Breadcrumb */}
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs mb-6 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Courses
          </Link>
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Info */}
            <div className="flex-1 animate-fade-up">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {school && schoolId !== "general" && (
                  <span
                    className="badge text-xs text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {school.icon} {school.label}
                  </span>
                )}
                {courseCode && (
                  <span className="font-mono text-sm text-white/50">
                    {courseCode}
                  </span>
                )}
                {level && (
                  <span className="badge text-xs bg-white/10 text-white/60">
                    {level}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
                {snippet.title}
              </h1>
              {description && (
                <p className="text-white/55 text-[15px] leading-relaxed mb-6 max-w-2xl line-clamp-3">
                  {description}
                </p>
              )}
              {/* Meta */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/45 mb-6">
                {instructor && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {instructor}
                  </span>
                )}
                {semester && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {semester}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  {contentDetails.itemCount} lectures
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Free
                </span>
              </div>
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-7">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full
                                             bg-white/10 text-white/70 border border-white/10"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {/* CTA row */}
              <div className="flex items-center gap-3 flex-wrap">
                {firstId && (
                  <Link
                    to={`/courses/${playlistId}/watch/${firstId}`}
                    className="btn-primary btn-lg gap-2.5"
                  >
                    <Play className="w-5 h-5" fill="white" strokeWidth={0} />
                    {progress > 0 ? "Continue Course" : "Start Course"}
                  </Link>
                )}
                <BookmarkButton playlistId={playlistId} size="lg" />
                {progress > 0 && (
                  <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `conic-gradient(${accent} ${progress * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-ocean-950 flex items-center justify-center">
                        <span className="text-[8px] font-mono font-bold text-white">
                          {progress}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Progress</p>
                      <p className="text-sm font-bold text-ocean-300">
                        {progress}% complete
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Thumbnail */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 animate-fade-in">
              <div className="rounded-2xl overflow-hidden shadow-deep border border-white/10">
                <img
                  src={getThumbnail(snippet, "high")}
                  alt={snippet.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="section py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lecture list */}
        <div className="lg:col-span-2">
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-ink mb-5">
              Lectures
              <span className="ml-2 text-base font-body text-ink-ghost font-normal">
                ({contentDetails.itemCount})
              </span>
            </h2>
          </ScrollReveal>
          <div className="space-y-1 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden p-2">
            {ll ? (
              Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))
            ) : le ? (
              <ErrorMessage title="Could not load lectures" />
            ) : (
              lectures?.map((item, i) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  playlistId={playlistId}
                  index={i}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <ScrollReveal>
            <div className="card-flat border border-slate-100 shadow-card">
              <MaterialsPanel playlistId={playlistId} />
            </div>
          </ScrollReveal>
          <ScrollReveal delay="0.1s">
            <div className="card-flat border border-slate-100 shadow-card">
              <h3 className="font-display text-base font-bold text-ink mb-4">
                Course Info
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  { label: "Lectures", val: contentDetails.itemCount },
                  level && { label: "Level", val: level },
                  instructor && { label: "Instructor", val: instructor },
                  semester && { label: "Semester", val: semester },
                  courseCode && { label: "Code", val: courseCode },
                  school &&
                    schoolId !== "general" && {
                      label: "School",
                      val: school.label,
                    },
                ]
                  .filter(Boolean)
                  .map(({ label, val }) => (
                    <div
                      key={label}
                      className="flex justify-between gap-2 pb-2.5 border-b border-slate-50 last:border-0 last:pb-0"
                    >
                      <dt className="text-ink-ghost">{label}</dt>
                      <dd className="font-semibold text-ink text-right">
                        {val}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          </ScrollReveal>
        </aside>
      </div>
    </>
  );
}
