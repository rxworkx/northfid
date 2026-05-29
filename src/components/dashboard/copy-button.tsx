"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { UserPlus, UserMinus } from "lucide-react";

export function CopyButton({ traderId, userId, isCopied: initial }: { traderId: string; userId: string; isCopied: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/copy-trading/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traderId, action: copied ? "remove" : "add" }),
      });
      if (!res.ok) throw new Error();
      setCopied((p) => !p);
      toast.success(copied ? "Stopped copying trader" : "Now copying this trader");
      router.refresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || userId === traderId}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-default disabled:opacity-60 disabled:cursor-not-allowed ${
        copied
          ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          : "bg-black text-white hover:bg-neutral-900 shadow-sm"
      }`}
    >
      {copied ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {loading ? "Loading..." : copied ? "Stop Copying" : "Copy This Trader"}
    </button>
  );
}
