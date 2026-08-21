import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Heart, ChevronLeft, ChevronRight, Github, Award, Users, Image as ImageIcon } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function Acknowledgments() {
  const { acknowledgmentsConfig } = useAdminData();
  const { headerTitle, headerSubtitle, slides = [], team = [], sponsors = [] } = acknowledgmentsConfig || {};

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance slides every 5 seconds if there are multiple slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <>
      <Helmet>
        <title>{headerTitle || "Acknowledgments"} — ZC OCW</title>
      </Helmet>

      {/* Header */}
      <div className="page-header">
        <div className="section max-w-4xl text-center">
          <Heart className="w-10 h-10 text-cyan-400 mx-auto mb-4 animate-bounce" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-3 text-white">
            {headerTitle || "Acknowledgments"}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base">
            {headerSubtitle || "Built by students, for students. Huge thanks to everyone who contributed."}
          </p>
        </div>
      </div>

      <div className="section py-12 max-w-5xl space-y-16">
        {/* Interactive Image Carousel / Hero Slideshow */}
        {slides.length > 0 && (
          <ScrollReveal>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-900 group">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                {slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      idx === activeSlide ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={slide.url}
                      alt={slide.title || "Acknowledgment photo"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/acknowledgments-hero.jpg";
                      }}
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Slide Caption Text */}
                    <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 text-white z-20">
                      <span className="badge bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-2">
                        Featured Highlight #{idx + 1}
                      </span>
                      <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
                        {slide.title}
                      </h3>
                      {slide.caption && (
                        <p className="text-slate-200 text-sm md:text-base max-w-2xl leading-relaxed">
                          {slide.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Controls */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:bg-cyan-500/80 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:bg-cyan-500/80 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          idx === activeSlide ? "w-8 bg-cyan-400" : "w-2.5 bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Team Members */}
        {team.length > 0 && (
          <section>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8 justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink dark:text-white">
                  Core Contributors & Team
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((m, i) => (
                <ScrollReveal key={m.id || m.name} delay={`${i * 0.1}s`}>
                  <div className="card text-center p-6 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-ocean-600 text-white font-display text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                      {m.name
                        ? m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                        : "ZC"}
                    </div>
                    <h3 className="font-bold text-ink dark:text-white text-lg">{m.name}</h3>
                    <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mt-1">
                      {m.role}
                    </p>
                    {m.school && (
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mt-3 text-xs">
                        {m.school}
                      </span>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* Partners & Sponsors */}
        {sponsors.length > 0 && (
          <section>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8 justify-center">
                <Award className="w-6 h-6 text-cyan-400" />
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink dark:text-white">
                  Clubs, Initiatives & Sponsors
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {sponsors.map((s, i) => (
                <ScrollReveal key={s.id || s.name} delay={`${i * 0.1}s`}>
                  <div className="card p-5 flex items-start gap-4 hover:border-cyan-500/40 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 fill-cyan-500/20" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink dark:text-white">{s.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {s.contribution}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* GitHub link */}
        <ScrollReveal className="text-center pt-4">
          <a
            href="https://github.com/MatthewNader2/zc-ocw"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline gap-2 inline-flex"
          >
            <Github className="w-4 h-4" /> Contribute on GitHub
          </a>
        </ScrollReveal>
      </div>
    </>
  );
}
