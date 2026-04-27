import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Bug,
  Mail,
  Filter,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function FeedbackViewer() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);

    const typeParam = filter === "all" ? "" : `?type=${filter}`;
    fetch(`${import.meta.env.VITE_WORKER_URL}/api/feedback${typeParam}`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_ADMIN_PASSWORD}`,
      },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [filter, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="section py-24 text-center">
        <p className="text-ink-muted">Unauthorized access</p>
      </div>
    );
  }

  const stats = {
    total: items.length,
    bugs: items.filter((i) => i.type === "bug").length,
    contacts: items.filter((i) => i.type === "contact").length,
    unemailed: items.filter((i) => !i.email_sent).length,
  };

  return (
    <>
      <Helmet>
        <title>Feedback — Admin</title>
      </Helmet>

      <div className="page-header">
        <div className="section">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs mb-4 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Admin Dashboard
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Feedback & Reports
          </h1>
          <p className="text-white/40">
            View bug reports and contact submissions from users
          </p>
        </div>
      </div>

      <div className="section py-8 max-w-6xl">
        {/* Stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: stats.total,
                color: "bg-ocean-500/10 text-ocean-600",
              },
              {
                label: "Bugs",
                value: stats.bugs,
                color: "bg-red-50 text-red-600",
              },
              {
                label: "Contacts",
                value: stats.contacts,
                color: "bg-blue-50 text-blue-600",
              },
              {
                label: "Unemailed",
                value: stats.unemailed,
                color: "bg-amber-50 text-amber-600",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className={`card p-4 text-center ${color}`}>
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="text-xs font-semibold mt-1 opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-ink-ghost" />
          <div className="flex gap-1.5">
            {["all", "bug", "contact"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === f
                    ? "bg-ocean-950 text-white shadow-sm"
                    : "bg-slate-100 text-ink-ghost hover:bg-slate-200"
                }`}
              >
                {f === "bug" ? (
                  <Bug className="w-3 h-3 inline mr-1" />
                ) : f === "contact" ? (
                  <Mail className="w-3 h-3 inline mr-1" />
                ) : null}
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-ink-ghost">Loading...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">Error: {error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-muted font-display text-lg">
              No feedback yet
            </p>
            <p className="text-sm text-ink-ghost mt-1">
              Submissions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <ScrollReveal key={item.id} delay={`${Math.min(i * 0.05, 0.3)}s`}>
                <div
                  className={`card p-5 border-l-4 transition-all hover:shadow-md ${
                    item.type === "bug"
                      ? "border-l-red-400"
                      : "border-l-blue-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-[10px] font-bold uppercase tracking-wider ${
                          item.type === "bug"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.email_sent ? (
                        <CheckCircle
                          className="w-3.5 h-3.5 text-green-500"
                          title="Email sent"
                        />
                      ) : (
                        <XCircle
                          className="w-3.5 h-3.5 text-amber-500"
                          title="Email not sent"
                        />
                      )}
                      <span className="text-xs text-ink-ghost">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-xs text-ocean-600 hover:underline flex items-center gap-1"
                    >
                      Reply <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h3 className="font-semibold text-ink mb-1">
                    {item.title || item.subject || "No subject"}
                  </h3>

                  <p className="text-sm text-ink-subtle mb-2">
                    {item.name} —{" "}
                    <span className="font-mono text-xs">{item.email}</span>
                    {item.category && ` · ${item.category}`}
                    {item.department && ` · ${item.department}`}
                  </p>

                  <p className="text-sm text-ink-ghost leading-relaxed whitespace-pre-line">
                    {item.message}
                  </p>

                  {item.steps && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-ink-ghost">
                      <p className="font-semibold text-ink-muted mb-1">
                        Steps to reproduce:
                      </p>
                      <p className="whitespace-pre-line">{item.steps}</p>
                    </div>
                  )}

                  {item.browser && (
                    <p className="mt-2 text-[10px] text-ink-ghost font-mono">
                      Browser: {item.browser}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
