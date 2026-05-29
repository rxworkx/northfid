"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

export function EmailVerification({ email }: { email: string }) {
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setLoading(true);
    const res = await fetch("/api/user/verify/email/send", { method: "POST" });
    if (res.ok) { setCodeSent(true); toast.info("Verification code sent to your email"); }
    else toast.error("Failed to send code");
    setLoading(false);
  }

  async function verifyCode() {
    setLoading(true);
    const res = await fetch("/api/user/verify/email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) { toast.success("Email verified!"); router.refresh(); }
    else { const d = await res.json(); toast.error(d.error ?? "Invalid code"); }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        A verification code will be sent to <strong>{email}</strong>
      </p>
      {!codeSent ? (
        <Button onClick={sendCode} loading={loading}>Send Verification Code</Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Enter the 6-digit code sent to your email:</p>
          <div className="flex gap-3 items-center">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="123456"
              className="h-10 w-36 rounded-lg border border-slate-300 px-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <Button onClick={verifyCode} loading={loading} disabled={code.length !== 6}>Verify</Button>
          </div>
          <button onClick={sendCode} className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2">Resend code</button>
        </div>
      )}
    </div>
  );
}
