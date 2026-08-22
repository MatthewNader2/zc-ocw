import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  LogOut,
  Settings,
  Edit2,
  ExternalLink,
  CheckCircle2,
  Layers,
  BookOpen,
  FileText,
  Mail,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { usePlaylists } from "@/hooks/useYouTube";
import { detectFromTitle, getSchool } from "@/data/coursesCatalog";
import { getThumbnail, fetchPlaylists } from "@/services/youtube";
import * as cloudflare from "@/services/cloudflare";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import ScrollReveal from "@/components/ui/ScrollReveal";
import clsx from "clsx";

const SCHOOL_ACCENT = {
  csai: "#0096c7",
  business: "#0d9488",
  science: "#7c3aed",
  engineering: "#ea580c",
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const { getCourseData, getMaterials, getBooks, isSpecialPlaylist, version } = useAdminData();
  const { data, isLoading, refetch } = usePlaylists();
  const courses = data?.pages?.flatMap((p) => p.items) ?? [];

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);

  const { enrichedCount, matCount, bookCount, needsReviewCount } = useMemo(() => {
    let enriched = 0;
    let mats = 0;
    let books = 0;
    let needsReview = 0;
    for (const c of courses) {
      const cd = getCourseData(c.id);
      if (cd?.instructor || cd?.schoolId) enriched++;
      else needsReview++;
      if (getMaterials(c.id).length > 0) mats++;
      if (getBooks(c.id).length > 0) books++;
    }
    return { enrichedCount: enriched, matCount: mats, bookCount: books, needsReviewCount: needsReview };
  }, [courses, getCourseData, getMaterials, getBooks, version]);

  async function handleSyncYouTube() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const ytData = await fetchPlaylists({ maxResults: 50 });
      const ytItems = ytData?.items || [];
      let newCount = 0;

      for (const item of ytItems) {
        const cd = getCourseData(item.id);
        if (!cd || Object.keys(cd).length === 0) {
          const auto = detectFromTitle(item.snippet.title);
          await cloudflare.upsertProfile(item.id, {
            category: "course",
            schoolId: auto?.schoolId || null,
            programId: auto?.programId || null,
            courseCode: auto?.code || null,
            courseName: auto?.name || item.snippet.title,
            isIncomplete: true,
            lectureCount: item.contentDetails?.itemCount || 0,
          });
          newCount++;
        }
      }

      await refetch();
      setSyncMsg(newCount > 0 ? `Synced! Found ${newCount} new playlist(s).` : "Channel already up-to-date!");
    } catch (e) {
      setSyncMsg(`Sync error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  const displayedCourses = useMemo(() => {
    if (!filterNeedsReview) return courses;
    return courses.filter((c) => {
      const cd = getCourseData(c.id);
      return !cd?.instructor && !cd?.schoolId;
    });
  }, [courses, filterNeedsReview, getCourseData]);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard — ZC OCW</title>
      </Helmet>

      <div className="page-header">
        <div className="section flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest mb-1">
              Admin Panel
            </p>
            <h1 className="font-display text-4xl font-bold">Dashboard</h1>
            <p className="text-white/45 text-sm mt-1">
              {courses.length} playlists from YouTube
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSyncYouTube}
              disabled={syncing}
              className="btn-primary gap-2 text-xs"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", syncing && "animate-spin")} />
              {syncing ? "Syncing YouTube…" : "Sync from YouTube Now"}
            </button>
            <Link to="/admin/settings" className="btn-outline-dark gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button onClick={logout} className="btn-outline-dark gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="section py-10">
        {syncMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            {syncMsg}
          </div>
        )}
        {/* Info */}
        <ScrollReveal>
          <div className="bg-ocean-50 border border-ocean-200/60 rounded-2xl p-5 mb-8 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-ocean-500/15 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-ocean-600" />
            </div>
            <div className="text-sm text-ink-muted space-y-1">
              <p className="font-semibold text-ink dark:text-white">Smart Auto-Detection</p>
              <p className="leading-relaxed">
                Playlist titles are scanned for course codes (e.g. "PHYS 323").
                When matched, school, program, and tags are set automatically.
                Use the Edit button to override anything and add materials. Run{" "}
                <code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">
                  npm run profile
                </code>{" "}
                in terminal to see a full detection table.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay="0.1s">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total playlists", value: courses.length, icon: Layers },
              { label: "Enriched", value: enrichedCount, icon: CheckCircle2 },
              { label: "With materials", value: matCount, icon: FileText },
              { label: "With books", value: bookCount, icon: BookOpen },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="card-flat border border-slate-100 dark:border-white/10 shadow-card text-center"
              >
                <Icon
                  className="w-5 h-5 text-ocean-500 mx-auto mb-2"
                  strokeWidth={1.8}
                />
                <p className="font-display text-3xl font-bold text-ocean-700">
                  {value}
                </p>
                <p className="text-xs text-ink-ghost mt-1">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Quick Actions */}
        <ScrollReveal delay="0.15s">
          <h2 className="font-display text-2xl text-ink dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <Link
              to="/admin/feedback"
              className="card p-6 hover:shadow-lg transition-all group border border-slate-100 dark:border-white/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-ocean-500/10 flex items-center justify-center mb-4 group-hover:bg-ocean-500/20 transition-colors">
                <Mail className="w-6 h-6 text-ocean-600" />
              </div>
              <h3 className="font-display font-bold text-ink dark:text-white mb-1">Feedback</h3>
              <p className="text-sm text-ink-ghost">
                View bug reports and contact messages
              </p>
            </Link>

            <Link
              to="/admin/courses"
              className="card p-6 hover:shadow-lg transition-all group border border-slate-100 dark:border-white/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <Edit2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-ink dark:text-white mb-1">
                Manage Courses
              </h3>
              <p className="text-sm text-ink-ghost">
                Edit metadata, add materials & books
              </p>
            </Link>

            <Link
              to="/admin/settings"
              className="card p-6 hover:shadow-lg transition-all group border border-slate-100 dark:border-white/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-4 group-hover:bg-slate-500/20 transition-colors">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="font-display font-bold text-ink dark:text-white mb-1">Settings</h3>
              <p className="text-sm text-ink-ghost">
                Configure API keys, domains & preferences
              </p>
            </Link>
          </div>
        </ScrollReveal>

        {/* Course list */}
        <ScrollReveal delay="0.2s">
          <h2 className="font-display text-2xl text-ink dark:text-white mb-5">All Courses</h2>
        </ScrollReveal>

        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="space-y-3">
            {courses.map((playlist, i) => {
              const override = getCourseData(playlist.id);
              const auto = detectFromTitle(playlist.snippet.title);
              const mats = getMaterials(playlist.id).length;
              const bks = getBooks(playlist.id).length;
              const schoolId = override.schoolId ?? auto?.schoolId ?? null;
              const school = getSchool(schoolId);
              const isEnriched = !!(
                override.instructor ||
                override.schoolId ||
                override.description
              );
              const accent = schoolId ? SCHOOL_ACCENT[schoolId] : null;

              return (
                <ScrollReveal
                  key={playlist.id}
                  delay={`${Math.min(i * 0.04, 0.4)}s`}
                >
                  <div className="card flex items-center gap-4 p-4 hover:shadow-card-hover group relative">
                    {/* Accent line */}
                    {accent && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.25rem]"
                        style={{ background: accent }}
                      />
                    )}

                    {/* Thumbnail */}
                    <img
                      src={getThumbnail(playlist.snippet, "medium")}
                      alt={playlist.snippet.title}
                      className="w-20 aspect-video object-cover rounded-xl flex-shrink-0 bg-slate-100 dark:bg-night-100"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {school && schoolId !== "general" && (
                          <span
                            className="badge text-[10px] text-white"
                            style={{ backgroundColor: accent }}
                          >
                            {school.short}
                          </span>
                        )}
                        {auto?.code && (
                          <span className="font-mono text-[11px] text-ink-ghost">
                            {auto.code}
                          </span>
                        )}
                        {auto?.confidence === "high" && (
                          <span className="badge text-[10px] bg-green-50 text-green-700">
                            auto ✓
                          </span>
                        )}
                        {isEnriched && (
                          <span className="badge text-[10px] bg-ocean-50 text-ocean-700">
                            enriched ✓
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm text-ink dark:text-white truncate">
                        {playlist.snippet.title}
                      </p>
                      <p className="text-xs text-ink-ghost mt-0.5">
                        {playlist.contentDetails.itemCount} lectures
                        {mats > 0 &&
                          ` · ${mats} material${mats > 1 ? "s" : ""}`}
                        {bks > 0 && ` · ${bks} book${bks > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        to={`/admin/courses/${playlist.id}`}
                        className="btn-primary btn-sm gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <Link
                        to={`/courses/${playlist.id}`}
                        className="btn-outline btn-sm gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
