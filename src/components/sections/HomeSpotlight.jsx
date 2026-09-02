import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Sparkles, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { useEditablePage } from "@/hooks/useEditablePage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import InlineEditable from "@/components/ui/InlineEditable";

const DEFAULT_HOME = {
  heroTitle: "Knowledge Unlocked",
  heroSubtitle: "Free lecture videos and course materials from Zewail City of Science and Technology — open to every learner.",
  featuredVideoUrl: "https://youtu.be/Kr1P4Awv2lE",
  featuredVideoBadge: "Featured Spotlight",
  featuredVideoTitle: "What is ZC OCW?",
  featuredVideoDescription: "Learn how Zewail City students and faculty came together to build an open educational platform carrying the knowledge of remarkable professors and researchers far beyond the classroom.",
};

function extractVideoId(url = "") {
  if (!url) return "Kr1P4Awv2lE";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : "Kr1P4Awv2lE";
}

export default function HomeSpotlight() {
  const { content } = useEditablePage("home", DEFAULT_HOME);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = content?.featuredVideoUrl || DEFAULT_HOME.featuredVideoUrl;
  const videoId = extractVideoId(videoUrl);
  const badge = content?.featuredVideoBadge || DEFAULT_HOME.featuredVideoBadge;
  const title = content?.featuredVideoTitle || DEFAULT_HOME.featuredVideoTitle;
  const description = content?.featuredVideoDescription || DEFAULT_HOME.featuredVideoDescription;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-ocean-950 via-slate-900 to-ocean-950 relative overflow-hidden border-t border-b border-white/8 text-white">
      {/* Background Ambience */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #00b4d8, #0077b6)" }}
      />
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="section relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left / Info Column */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            <ScrollReveal>
              <InlineEditable
                page="home"
                field="featuredVideoBadge"
                value={badge}
                defaultContent={DEFAULT_HOME}
                label="Spotlight Badge"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{badge}</span>
                </div>
              </InlineEditable>
            </ScrollReveal>

            <ScrollReveal delay="0.1s">
              <InlineEditable
                page="home"
                field="featuredVideoTitle"
                value={title}
                defaultContent={DEFAULT_HOME}
                label="Spotlight Title"
              >
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  {title}
                </h2>
              </InlineEditable>
            </ScrollReveal>

            <ScrollReveal delay="0.15s">
              <InlineEditable
                page="home"
                field="featuredVideoDescription"
                value={description}
                defaultContent={DEFAULT_HOME}
                multiline
                label="Spotlight Description"
              >
                <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 whitespace-pre-line">
                  {description}
                </p>
              </InlineEditable>
            </ScrollReveal>

            <ScrollReveal delay="0.2s" className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="btn-primary gap-2.5 text-sm py-3 px-6 shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-4 h-4 fill-white" /> Watch Introduction
              </button>
              <Link
                to="/about"
                className="btn-outline gap-2 text-sm py-3 px-5 text-white/80 hover:text-white border-white/20 hover:border-white/40"
              >
                Our Full Story <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollReveal>

            <ScrollReveal delay="0.25s">
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-white/50 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Verified Faculty Content</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-400 fill-red-400/30" />
                  <span>100% Free & Open</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right / Video Player Column */}
          <div className="lg:col-span-7">
            <ScrollReveal delay="0.1s">
              <div className="relative rounded-3xl overflow-hidden bg-black/80 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 aspect-video group">
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div
                    onClick={() => setIsPlaying(true)}
                    className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <img
                      src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                      }}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/30 to-transparent" />

                    {/* Large glowing play button */}
                    <div className="absolute w-20 h-20 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-ocean-950 flex items-center justify-center shadow-glow transition-all duration-300 group-hover:scale-110">
                      <Play className="w-8 h-8 fill-ocean-950 ml-1" />
                    </div>

                    {/* Video Banner Tag */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/10">
                        {title}
                      </span>
                      <span className="text-xs text-white/80 font-mono bg-black/60 px-2.5 py-1 rounded-lg">
                        YouTube HD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
