import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useCourse } from "@/hooks/useYouTube";
import { SCHOOLS, PROGRAMS, detectFromTitle } from "@/data/coursesCatalog";
import autoProfiles from "@/data/auto-profiles.json";
import MaterialsPanel from "@/components/ui/MaterialsPanel";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import ScrollReveal from "@/components/ui/ScrollReveal";

const LEVELS = ["Undergraduate", "Graduate", "All levels"];

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5">
      <label className="block text-sm font-semibold text-ink">{children}</label>
      {hint && <p className="text-xs text-ink-ghost mt-0.5">{hint}</p>}
    </div>
  );
}

export default function AdminCourseEditor() {
  const { playlistId } = useParams();
  const { data: course, isLoading } = useCourse(playlistId);
  const { getCourseData, saveCourseData } = useAdminData();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    schoolId: "",
    programId: "",
    courseCode: "",
    instructor: "",
    semester: "",
    level: "",
    description: "",
    tags: "",
  });

  const auto = course ? detectFromTitle(course.snippet.title) : null;
  const profilerData =
    autoProfiles.results?.find((r) => r.playlistId === playlistId)?.suggested ||
    {};
  const programs = PROGRAMS[form.schoolId] || [];

  // Combine runtime detection with our saved static profiler data
  const detected = {
    code: profilerData.courseCode || auto?.code,
    schoolId: profilerData.schoolId || auto?.schoolId,
    programId: auto?.programId, // Profiler doesn't track programId currently
    instructor: profilerData.instructor || auto?.instructor,
    tags: auto?.tags || [],
    name: profilerData.courseName || auto?.name,
    confidence: auto?.confidence || "none",
  };

  useEffect(() => {
    if (!course) return;
    const s = getCourseData(playlistId);
    setForm({
      // Notice how we use || instead of ?? to ignore empty strings from saved data
      schoolId: s.schoolId || detected.schoolId || "",
      programId: s.programId || detected.programId || "",
      courseCode: s.courseCode || detected.code || "",
      instructor: s.instructor || detected.instructor || "",
      semester: s.semester || "",
      level: s.level || "",
      description: s.description || course.snippet.description || "",
      tags: (s.tags?.length ? s.tags : detected.tags).join(", "),
    });
  }, [course?.id]); // eslint-disable-line

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    saveCourseData(playlistId, {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  function applyAuto() {
    setForm((f) => ({
      ...f,
      schoolId: detected.schoolId || f.schoolId,
      programId: detected.programId || f.programId,
      courseCode: detected.code || f.courseCode,
      instructor: detected.instructor || f.instructor,
      tags: detected.tags.join(", ") || f.tags,
    }));
    setSaved(false);
  }

  if (isLoading) return <PageLoader />;
  if (!course)
    return (
      <div className="section py-20 text-center text-ink-ghost">
        Course not found.
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Edit: {course.snippet.title} — Admin</title>
      </Helmet>

      <div className="page-header">
        <div className="section">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-snug line-clamp-2">
            {course.snippet.title}
          </h1>
          {detected.confidence === "high" && (
            <p className="text-ocean-400 text-sm mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Auto-detected: <strong>{detected.code}</strong> —{" "}
              {detected.name ?? "known course"}
            </p>
          )}
        </div>
      </div>

      <div className="section py-10 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ── Metadata form (3 cols) ── */}
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSave}
            className="card-flat border border-slate-100 shadow-card space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-display text-xl font-bold text-ink">
                Course Metadata
              </h2>
              {auto && (
                <button
                  type="button"
                  onClick={applyAuto}
                  className="btn-outline btn-sm gap-1.5 text-ocean-600 border-ocean-200 hover:bg-ocean-50"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Apply auto-detected
                </button>
              )}
            </div>

            {/* School + Program */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>School</FieldLabel>
                <select
                  value={form.schoolId}
                  onChange={(e) => set("schoolId", e.target.value)}
                  className="input"
                >
                  <option value="">— Select —</option>
                  {SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Program</FieldLabel>
                <select
                  value={form.programId}
                  onChange={(e) => set("programId", e.target.value)}
                  className="input"
                  disabled={!form.schoolId}
                >
                  <option value="">— Select —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course code */}
            <div>
              <FieldLabel hint="E.g. PHYS 323, CIE 337">
                Course Code
                {detected.code && (
                  <button
                    type="button"
                    onClick={() => set("courseCode", detected.code)}
                    className="ml-2 text-xs text-ocean-500 hover:underline font-normal"
                  >
                    Use: {detected.code}
                  </button>
                )}
              </FieldLabel>
              <input
                value={form.courseCode}
                onChange={(e) => set("courseCode", e.target.value)}
                placeholder="PHYS 323"
                className="input"
              />
            </div>

            {/* Instructor + Semester */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Instructor</FieldLabel>
                <input
                  value={form.instructor}
                  onChange={(e) => set("instructor", e.target.value)}
                  placeholder="Prof. Ahmed Hassan"
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Semester</FieldLabel>
                <input
                  value={form.semester}
                  onChange={(e) => set("semester", e.target.value)}
                  placeholder="Fall 2024"
                  className="input"
                />
              </div>
            </div>

            {/* Level */}
            <div>
              <FieldLabel>Level</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => set("level", form.level === l ? "" : l)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      form.level === l
                        ? "bg-ocean-950 text-white border-ocean-950"
                        : "border-slate-200 text-ink-subtle hover:border-ocean-300 hover:text-ocean-600"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                className="input resize-none"
                placeholder="Course description shown to students…"
              />
            </div>

            {/* Tags */}
            <div>
              <FieldLabel hint="Comma-separated list">
                Topic Tags
                {detected.tags?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => set("tags", detected.tags.join(", "))}
                    className="ml-2 text-xs text-ocean-500 hover:underline font-normal"
                  >
                    Use detected
                  </button>
                )}
              </FieldLabel>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="quantum mechanics, physics, thermodynamics"
                className="input"
              />
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className={`btn gap-2 ${saved ? "btn-outline border-green-300 text-green-600" : "btn-primary"}`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
              <Link to={`/courses/${playlistId}`} className="btn-ghost gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </Link>
            </div>
          </form>
        </div>

        {/* ── Materials + info (2 cols) ── */}
        <div className="lg:col-span-2 space-y-6">
          <ScrollReveal>
            <div className="card-flat border border-slate-100 shadow-card">
              <MaterialsPanel playlistId={playlistId} inAdmin />
            </div>
          </ScrollReveal>

          <ScrollReveal delay="0.1s">
            <div className="card-flat border border-slate-100 shadow-card text-sm space-y-2">
              <h3 className="font-semibold text-ink mb-3">Playlist Info</h3>
              <p className="text-ink-ghost">ID:</p>
              <code className="block bg-slate-50 rounded-lg px-3 py-2 text-xs font-mono text-ink-muted break-all">
                {playlistId}
              </code>
              <p className="text-ink-ghost mt-2">
                Lectures:{" "}
                <strong className="text-ink">
                  {course.contentDetails.itemCount}
                </strong>
              </p>
              {auto && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs font-semibold text-ink">
                    Auto-detection
                  </p>
                  <p className="text-xs text-ink-ghost">
                    Code: {auto.code ?? "not detected"}
                  </p>
                  <p className="text-xs text-ink-ghost">
                    School: {auto.schoolId ?? "unknown"}
                  </p>
                  <p className="text-xs text-ink-ghost">
                    Confidence:{" "}
                    <span
                      className={
                        auto.confidence === "high"
                          ? "text-green-600 font-semibold"
                          : "text-amber-600"
                      }
                    >
                      {auto.confidence}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}
