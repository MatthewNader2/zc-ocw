import { Helmet } from "react-helmet-async";
import { usePlaylists } from "@/hooks/useYouTube";
import CourseCard from "@/components/ui/CourseCard";
import { CourseCardSkeleton } from "@/components/ui/LoadingSpinner";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getPlaylistCategory } from "@/data/profileHelpers";

export default function Interviews() {
  const { data, isLoading } = usePlaylists();
  const allItems = data?.pages?.flatMap((p) => p.items) ?? [];

  const specialItems = allItems
    .filter((c) => getPlaylistCategory(c.id) !== "course")
    .sort((a, b) => {
      // Interviews first, then everything else alphabetical by title
      const aCat = getPlaylistCategory(a.id);
      const bCat = getPlaylistCategory(b.id);
      if (aCat === "interviews" && bCat !== "interviews") return -1;
      if (bCat === "interviews" && aCat !== "interviews") return 1;
      return a.snippet.title.localeCompare(b.snippet.title);
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

      <div className="bg-ocean-950 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="section relative z-10 text-center">
          <ScrollReveal>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Interviews & Special Content
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Conversations, public lectures, and special series from the Zewail
              City community.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <div className="section py-16 min-h-[50vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))
          ) : specialItems.length === 0 ? (
            <div className="col-span-full text-center py-24">
              <p className="font-display text-xl text-ink-muted mb-2">
                No content found
              </p>
              <p className="text-sm text-ink-ghost">
                Run the profiler to sync the latest playlists.
              </p>
            </div>
          ) : (
            specialItems.map((c, i) => (
              <ScrollReveal key={c.id} delay={`${i * 0.1}s`}>
                <CourseCard playlist={c} className="h-full" />
              </ScrollReveal>
            ))
          )}
        </div>
      </div>
    </>
  );
}
