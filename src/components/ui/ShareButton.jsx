import { useState } from "react";
import { Share2, Check } from "lucide-react";
import clsx from "clsx";

export default function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = { title, url: url || window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      className={clsx(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
        copied
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-white border-slate-200 text-ink-subtle hover:border-ocean-400 hover:text-ocean-600",
      )}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
