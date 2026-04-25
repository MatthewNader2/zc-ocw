import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  BookOpen,
  Users,
  PlayCircle,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChannelStats } from "@/hooks/useYouTube";

function AnimatedNumber({ target, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(t);
      } else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return (
    <>
      {val.toLocaleString()}
      {suffix}
    </>
  );
}

export default function HeroSection() {
  const { data: channel } = useChannelStats();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const videoCount = channel?.statistics?.videoCount
    ? Number(channel.statistics.videoCount)
    : 500;

  const stats = [
    { icon: PlayCircle, label: "Lectures", value: videoCount, suffix: "+" },
    { icon: BookOpen, label: "Courses", value: 50, suffix: "+" },
    { icon: Users, label: "Schools", value: 4, suffix: "" },
    { icon: Award, label: "Free", value: 100, suffix: "%" },
  ];

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center bg-ocean-950 overflow-hidden">
      {/* Layered backgrounds */}
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-hero-mesh" />

      {/* Animated blobs */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[80px]"
        style={{ background: "radial-gradient(circle, #00b4d8, #0077b6)" }}
      />
      <div
        className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[60px] animate-float"
        style={{ background: "radial-gradient(circle, #48cae4, #0096c7)" }}
      />
      <div
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[50px]"
        style={{ background: "radial-gradient(circle, #90e0ef, transparent)" }}
      />

      <div className="section relative z-10 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* OCW Logo — handles jpg/svg/missing gracefully */}
          <div
            className={`flex justify-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
          >
            <div className="relative">
              <img
                src="/ocw-logo.jpg"
                alt="ZC OCW"
                className="h-20 w-20 object-cover rounded-2xl shadow-glow border border-ocean-400/20"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  // Try SVG fallback
                  const svgImg = new window.Image();
                  svgImg.onload = () => {
                    e.currentTarget.src = "/ocw-logo.svg";
                    e.currentTarget.className = "h-16 w-auto object-contain";
                  };
                  svgImg.onerror = () => {
                    e.currentTarget.parentElement.style.display = "none";
                  };
                  svgImg.src = "/ocw-logo.svg";
                }}
              />
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl animate-pulse-ring" />
            </div>
          </div>

          {/* Headline */}
          <h1
            className={clsx_light(
              "font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.08] mb-6 tracking-tight transition-all duration-700 delay-100",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
            )}
          >
            Knowledge{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-ocean-400 to-ocean-300 bg-clip-text text-transparent">
                Unlocked
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 8"
                fill="none"
              >
                <path
                  d="M2 6 Q75 1 150 5 Q225 9 298 3"
                  stroke="url(#ul)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="ul" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#48cae4" />
                    <stop offset="100%" stopColor="#90e0ef" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p
            className={clsx_light(
              "text-white/55 text-lg md:text-xl font-body mb-10 leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-200",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            )}
          >
            Free lecture videos and course materials from{" "}
            <span className="text-white font-semibold">
              Zewail City of Science and Technology
            </span>{" "}
            — open to every learner.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className={clsx_light(
              "max-w-xl mx-auto mb-8 transition-all duration-700 delay-300",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="relative flex items-center gap-0 glass p-1.5">
              <Search className="absolute left-5 w-5 h-5 text-white/40 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search courses, topics, instructors…"
                className="flex-1 bg-transparent pl-12 pr-4 py-3 text-white placeholder-white/35
                           text-sm font-body focus:outline-none"
              />
              <button
                type="submit"
                className="btn-primary flex-shrink-0 gap-2 px-6 py-3 text-sm rounded-xl"
              >
                Search
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* CTAs */}
          <div
            className={clsx_light(
              "flex flex-wrap gap-3 justify-center mb-16 transition-all duration-700 delay-400",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <Link
              to="/courses"
              className="btn-primary btn-lg gap-2 animate-pulse-ring"
            >
              Browse Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/departments"
              className="glass text-white/85 font-semibold px-7 py-3.5 rounded-xl text-sm
                             hover:bg-white/20 transition-all cursor-pointer"
            >
              By Department
            </Link>
            <a
              href={`https://www.youtube.com/channel/${import.meta.env.VITE_YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass text-white/85 font-semibold px-7 py-3.5 rounded-xl text-sm
                          hover:bg-red-500/20 hover:text-white transition-all cursor-pointer flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" /> YouTube Channel
            </a>
          </div>

          {/* Stats */}
          <div
            className={clsx_light(
              "grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto transition-all duration-700 delay-500",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            {stats.map(({ icon: Icon, label, value, suffix }) => (
              <div
                key={label}
                className="glass rounded-2xl p-5 text-center group hover:bg-white/15 transition-all"
              >
                <Icon
                  className="w-5 h-5 text-ocean-400 mx-auto mb-2"
                  strokeWidth={1.8}
                />
                <p className="font-display text-2xl font-bold text-white">
                  <AnimatedNumber target={value} suffix={suffix} />
                </p>
                <p className="text-white/40 text-xs mt-0.5 font-body">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* School color accent bottom */}
      <div className="absolute bottom-0 inset-x-0 flex h-1">
        {["#0096c7", "#0d9488", "#7c3aed", "#ea580c"].map((c) => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-5 h-8 rounded-full border border-white/20 flex items-center justify-center">
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </div>
      </div>
    </section>
  );
}

function clsx_light(...args) {
  return args.filter(Boolean).join(" ");
}
