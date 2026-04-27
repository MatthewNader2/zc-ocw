import { usePlaylists } from "@/hooks/useYouTube";
import { getPlaylistProfile } from "@/data/profileHelpers";
import CourseCard from "@/components/ui/CourseCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function RelatedCourses({ currentPlaylistId }) {
  const { data } = usePlaylists();
  const all = data?.pages?.flatMap((p) => p.items) ?? [];

  const current = getPlaylistProfile(currentPlaylistId);
  const school = current?.suggested?.schoolId;
  const program = current?.suggested?.programId;

  const related = all
    .filter((c) => c.id !== currentPlaylistId)
    .filter((c) => {
      const p = getPlaylistProfile(c.id);
      return (
        p?.suggested?.schoolId === school || p?.suggested?.programId === program
      );
    })
    .slice(0, 3);

  if (!related.length) return null;

  return (
    <section className="py-12 border-t border-slate-100">
      <div className="section">
        <h2 className="font-display text-2xl font-bold text-ink mb-6">
          Related Courses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((c, i) => (
            <ScrollReveal key={c.id} delay={`${i * 0.1}s`}>
              <CourseCard playlist={c} className="h-full" />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
