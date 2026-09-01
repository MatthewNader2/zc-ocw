import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { usePlaylists } from "@/hooks/useYouTube";
import CourseCard from "@/components/ui/CourseCard";
import { CourseCardSkeleton } from "@/components/ui/LoadingSpinner";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getPlaylistCategory } from "@/data/profileHelpers";
import clsx from "clsx";

const CATEGORY_TABS = [
  { id: "all", label: "All Special Content" },
  { id: "interviews", label: "🎙️ Interviews" },
  { id: "public-lectures", label: "🏛️ Public Lectures" },
  { id: "special", label: "✨ Special Series" },
  { id: "club", label: "👥 Student Clubs" },
];

export default function Interviews() {
  const { data, isLoading } = usePlaylists();
  const [activeTab, setActiveTab] = useState("all");
  const allItems = data?.pages?.flatMap((p) => p.items) ?? [];

  const specialItems = allItems
    .filter((c) => {
      const cat = getPlaylistCategory(c.id, c.snippet?.title);
      if (cat === "course") return false;
      if (activeTab === "all") return true;
      return cat === activeTab;
    })
    .sort((a, b) => {
      // Interviews first, then everything else alphabetical by title
      const aCat = getPlaylistCategory(a.id, a.snippet?.title);
      const bCat = getPlaylistCategory(b.id, b.snippet?.title);
      if (aCat === "interviews" && bCat !== "interviews") return -1;
      if (bCat === "interviews" && aCat !== "interviews") return 1;
      return (a.snippet?.title || "").localeCompare(b.snippet?.title || "");
    });

  return (
    <>
      <Helmet>
        <title>Interviews & Special Content — ZC OCW</title>
        <meta
          name="description"
          content="Exclusive interviews, public lectures, and special series from Zewail City faculty and guests."
        />
      </Helmet>

      <div className="bg-ocean-950 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="section relative z-10 text-center">
          <ScrollReveal>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Interviews & Special Content
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg">
              Conversations, public lectures, podcasts, and special series from across the Zewail City community.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="section py-10 min-h-[50vh] space-y-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm",
                activeTab === tab.id
                  ? "bg-ocean-600 text-white shadow-ocean-600/30"
                  : "bg-slate-100 dark:bg-night-200/80 text-ink dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          ) : specialItems.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="font-display text-lg text-ink-muted dark:text-slate-400 mb-2">
                No content found in this category
              </p>
              <p className="text-xs text-ink-ghost dark:text-slate-500">
                You can assign playlists to Interviews or Special Content in the Admin panel.
              </p>
            </div>
          ) : (
            specialItems.map((c, i) => (
              <ScrollReveal key={c.id} delay={`${i * 0.08}s`}>
                <CourseCard playlist={c} className="h-full" />
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </>
  );
}
