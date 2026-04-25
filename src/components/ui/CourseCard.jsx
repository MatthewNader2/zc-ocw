import { Link } from "react-router-dom";
import { Play, BookOpen, CheckCircle2, FileText } from "lucide-react";
import { getThumbnail } from "@/services/youtube";
import { detectFromTitle, getSchool } from "@/data/coursesCatalog";
import { getPlaylistProfile } from "@/data/profileHelpers";
import { useAdminData } from "@/context/AdminDataContext";
import { useProgress } from "@/context/ProgressContext";
import { useSettings } from "@/context/SettingsContext";
import BookmarkButton from "./BookmarkButton";
import clsx from "clsx";

const SCHOOL_COLOR = {
  csai: { bg: "#0096c7", light: "rgba(0,150,199,0.10)", text: "#0096c7" },
  business: { bg: "#0d9488", light: "rgba(13,148,136,0.10)", text: "#0d9488" },
  science: { bg: "#7c3aed", light: "rgba(124,58,237,0.10)", text: "#7c3aed" },
  engineering: {
    bg: "#ea580c",
    light: "rgba(234,88,12,0.10)",
    text: "#ea580c",
  },
  general: { bg: "#64748b", light: "rgba(100,116,139,0.10)", text: "#64748b" },
};

export default function CourseCard({ playlist, className, lectureIds = [] }) {
  const { id, snippet, contentDetails } = playlist;
  const { getCourseData, getMaterials } = useAdminData();
  const { getCourseProgress, isWatched } = useProgress();
  const { settings } = useSettings();

  const override = getCourseData(id);
  const auto = detectFromTitle(snippet.title);
  const profile = getPlaylistProfile(id);
  const profilerData = profile?.suggested || {};

  // 🔥 Changed ?? to || so it ignores empty strings from the admin panel!
  const schoolId =
    override.schoolId || profilerData.schoolId || auto?.schoolId || "general";
  const school = getSchool(schoolId);
  const accent = SCHOOL_COLOR[schoolId] || SCHOOL_COLOR.general;
  const tags = override.tags?.length ? override.tags : auto?.tags || [];

  const instructor =
    override.instructor || profilerData.instructor || auto?.instructor || null;
  const level = override.level || null;
  const courseCode =
    override.courseCode || profilerData.courseCode || auto?.code || null;
  const matCount = getMaterials(id).length;

  // 🐛 DEBUG TOOL: If it's still failing, check your browser's inspect console!
  console.log(`Card [${courseCode}]:`, {
    title: snippet.title,
    profilerData,
    instructor,
  });

  const ids = lectureIds.length ? lectureIds : [];
  const progress =
    settings.showProgress && ids.length ? getCourseProgress(ids) : 0;

  return (
    <Link
      to={`/courses/${id}`}
      className={clsx("card group relative flex flex-col", className)}
    >
      {/* School top accent bar */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 rounded-t-[1.25rem] z-10"
        style={{ background: accent.bg }}
      />

      {/* Bookmark */}
      <div className="absolute top-3 right-3 z-10">
        <BookmarkButton playlistId={id} size="sm" />
      </div>

      {/* Progress ring overlay */}
      {progress > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${accent.bg} ${progress * 3.6}deg, rgba(255,255,255,0.15) 0deg)`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
              <span
                className="text-[7px] font-mono font-bold"
                style={{ color: accent.bg }}
              >
                {progress}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-ocean-950">
        <img
          src={getThumbnail(snippet, "medium")}
          alt={snippet.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          loading="lazy"
        />
        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Lecture count */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
          <Play className="w-3 h-3 text-white" fill="white" strokeWidth={0} />
          <span className="text-white text-xs font-semibold font-mono">
            {contentDetails.itemCount}
          </span>
        </div>

        {/* Materials badge */}
        {matCount > 0 && (
          <div
            className="absolute bottom-2.5 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm
                          rounded-full px-2 py-0.5"
          >
            <FileText className="w-3 h-3 text-white" />
            <span className="text-white text-[10px] font-semibold">
              {matCount}
            </span>
          </div>
        )}

        {/* Play hover */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
                        transition-all duration-300 bg-black/20"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-glow-lg
                          scale-90 group-hover:scale-100 transition-transform duration-300"
            style={{ background: accent.bg }}
          >
            <Play
              className="w-6 h-6 text-white ml-0.5"
              fill="white"
              strokeWidth={0}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* School badge + code */}
        <div className="flex items-center gap-2 flex-wrap">
          {school && schoolId !== "general" && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: accent.light, color: accent.text }}
            >
              {school.icon} {school.short}
            </span>
          )}
          {courseCode && (
            <span className="font-mono text-[11px] text-ink-ghost">
              {courseCode}
            </span>
          )}
          {level && (
            <span className="ml-auto text-[11px] font-semibold text-ink-ghost bg-slate-100 px-2 py-0.5 rounded-full">
              {level}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-display font-bold text-[15px] text-ink leading-snug line-clamp-2
                       transition-colors duration-200 group-hover:text-ocean-600"
        >
          {snippet.title}
        </h3>

        {/* Instructor */}
        {instructor && (
          <p className="text-xs text-ink-ghost flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            {instructor}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full
                                       bg-ocean-50 text-ocean-600 border border-ocean-100"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-auto pt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-ink-ghost">Progress</span>
              <span
                className="font-mono font-bold"
                style={{ color: accent.bg }}
              >
                {progress}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%`, background: accent.bg }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto text-xs">
          <span className="text-ink-ghost">
            {contentDetails.itemCount} lectures
          </span>
          <span
            className="font-semibold transition-all duration-200 group-hover:translate-x-0.5"
            style={{ color: accent.bg }}
          >
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}
