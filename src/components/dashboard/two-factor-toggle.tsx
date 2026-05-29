"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";

export function TwoFactorToggle({ enabled: initial }: { enabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/security/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      setEnabled((p) => !p);
      toast.success(`Two-factor authentication ${enabled ? "disabled" : "enabled"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update 2FA settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900">{enabled ? "2FA is enabled" : "2FA is disabled"}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {enabled ? "Your account has extra protection." : "Enable 2FA for stronger security."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-60 ${
          enabled ? "bg-black" : "bg-slate-200"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
