import { Helmet } from "react-helmet-async";
import { Github, Heart } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const TEAM = [
  { name: "Your Name", role: "Project Lead & Full-Stack Dev", school: "CSAI" },
  { name: "Contributor A", role: "UI/UX Design", school: "Engineering" },
  { name: "Contributor B", role: "Content Curation", school: "Science" },
];

const CLUBS = [
  { name: "Physics Club", contribution: "Public Lectures & Recording" },
  { name: "CFP Summer School", contribution: "Mini-Course Content" },
];

export default function Acknowledgments() {
  return (
    <>
      <Helmet>
        <title>Acknowledgments — ZC OCW</title>
      </Helmet>
      <div className="page-header">
        <div className="section max-w-4xl text-center">
          <Heart className="w-10 h-10 text-ocean-400 mx-auto mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Acknowledgments
          </h1>
          <p className="text-white/50 max-w-2xl mx-auto">
            Built by students, for students. Huge thanks to everyone who
            contributed.
          </p>
        </div>
      </div>

      <div className="section py-16 max-w-5xl space-y-16">
        <section>
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-ink mb-8 text-center">
              Core Team
            </h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((m, i) => (
              <ScrollReveal key={m.name} delay={`${i * 0.1}s`}>
                <div className="card text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-ocean-100 text-ocean-600 font-display text-xl font-bold flex items-center justify-center mx-auto mb-4">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <h3 className="font-bold text-ink">{m.name}</h3>
                  <p className="text-sm text-ocean-600 font-medium mt-1">
                    {m.role}
                  </p>
                  <span className="badge bg-slate-100 text-ink-ghost mt-3 text-xs">
                    {m.school}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <section>
          <ScrollReveal>
            <h2 className="font-display text-2xl font-bold text-ink mb-8 text-center">
              Clubs & Partners
            </h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {CLUBS.map((c, i) => (
              <ScrollReveal key={c.name} delay={`${i * 0.1}s`}>
                <div className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ocean-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-ocean-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">{c.name}</h3>
                    <p className="text-sm text-ink-ghost mt-1">
                      {c.contribution}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        <ScrollReveal className="text-center">
          <a
            href="https://github.com/your-org/zc-ocw"
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
