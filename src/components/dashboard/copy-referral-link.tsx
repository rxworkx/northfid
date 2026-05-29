"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyReferralLink({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 font-mono"
        />
        <button
          onClick={copy}
          className={`shrink-0 h-10 px-4 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-2 ${
            copied ? "bg-emerald-600 text-white" : "bg-black text-white hover:bg-neutral-900"
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {code && <p className="text-xs text-slate-500">Your code: <strong className="text-slate-800">{code}</strong></p>}
    </div>
  );
}
