"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";

interface CopyButtonProps {
  copyTraderId: string;
  isCopied: boolean;
  compact?: boolean;
}

export function CopyButton({ copyTraderId, isCopied: initial, compact = false }: CopyButtonProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch("/api/copy-trading/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyTraderId, action: copied ? "remove" : "add" }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Action failed");
        return;
      }
      setCopied((p) => !p);
      toast.success(copied ? "Stopped copying trader" : "Now copying this trader");
      router.refresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
          copied
            ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
            : "bg-black border-black text-white hover:bg-zinc-900"
        }`}
      >
        {loading ? "..." : copied ? "×" : "Copy"}
      </button>
    );
  }

  if (copied) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
          ✓ Copying
        </span>
        <button
          onClick={toggle}
          disabled={loading}
          title="Stop copying"
          className="h-9 px-4 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors text-sm font-semibold shrink-0"
        >
          {loading ? "..." : "Stop"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:bg-zinc-900 disabled:opacity-50 transition-colors"
    >
      {loading ? "Loading..." : "Copy Trader"}
    </button>
  );
}
