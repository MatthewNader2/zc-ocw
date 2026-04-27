import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Bug, Send, CheckCircle } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const CATEGORIES = [
  "UI / UX",
  "Video Player",
  "Search",
  "Course Data",
  "Mobile",
  "Other",
];

export default function ReportBug() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "UI / UX",
    title: "",
    steps: "",
    browser: "",
  });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(
        `${import.meta.env.VITE_WORKER_URL}/api/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "bug", ...form }),
          signal: controller.signal,
          credentials: "omit", // Prevents extension cookie interference
        },
      );
      clearTimeout(timeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      setSent(true);
    } catch (err) {
      console.error("Submit failed:", err);
      // Still save locally so user data isn't lost
      const pending = JSON.parse(
        localStorage.getItem("zcocw_pending_feedback") || "[]",
      );
      pending.push({ type: "bug", ...form, timestamp: Date.now() });
      localStorage.setItem("zcocw_pending_feedback", JSON.stringify(pending));
      alert(
        "Could not send right now. Your report is saved and will retry on next visit.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent)
    return (
      <div className="section py-24 text-center max-w-md mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-ink mb-2">
          Bug Report Sent
        </h1>
        <p className="text-ink-muted">
          Thank you. Our dev team will investigate.
        </p>
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Report a Bug — ZC OCW</title>
      </Helmet>
      <div className="page-header">
        <div className="section max-w-3xl">
          <h1 className="font-display text-4xl font-bold mb-2 flex items-center gap-3">
            <Bug className="w-8 h-8 text-ocean-400" /> Report a Bug
          </h1>
          <p className="text-white/40">
            Found something broken? Tell us and we will fix it.
          </p>
        </div>
      </div>
      <div className="section py-12 max-w-3xl">
        <ScrollReveal>
          <form onSubmit={submit} className="card space-y-5 p-6 md:p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Name
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                  Email
                </label>
                <input
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Category
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Short Title
              </label>
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                placeholder="e.g. Search results empty"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Steps to Reproduce
              </label>
              <textarea
                required
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                placeholder="1. Go to... 2. Click..."
                value={form.steps}
                onChange={(e) =>
                  setForm((f) => ({ ...f, steps: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Browser / Device
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-ghost focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20 transition-all"
                placeholder="Chrome 120 on Windows 11"
                value={form.browser}
                onChange={(e) =>
                  setForm((f) => ({ ...f, browser: e.target.value }))
                }
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full gap-2"
            >
              <Send className="w-4 h-4" />{" "}
              {loading ? "Sending…" : "Send Report"}
            </button>
          </form>
        </ScrollReveal>
      </div>
    </>
  );
}
