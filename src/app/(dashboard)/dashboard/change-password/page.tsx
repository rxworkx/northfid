"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordInput) {
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed to update password");
      return;
    }
    toast.success("Password changed successfully");
    reset();
  }

  const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 hover:border-slate-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black transition-colors";

  return (
    <div className="max-w-md space-y-6">
      <Link href="/dashboard/security" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Security
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Change Password</h2>
        <p className="text-sm text-slate-500 mb-6">Use a strong password with uppercase letters and numbers</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { field: "currentPassword" as const, label: "Current Password", show: showCurrent, setShow: setShowCurrent },
            { field: "newPassword" as const, label: "New Password", show: showNew, setShow: setShowNew },
            { field: "confirmPassword" as const, label: "Confirm New Password", show: showConfirm, setShow: setShowConfirm },
          ].map(({ field, label, show, setShow }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="relative">
                <input {...register(field)} type={show ? "text" : "password"} className={inputClass} />
                <button type="button" onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>}
            </div>
          ))}

          <Button type="submit" loading={isSubmitting} className="w-full">Update Password</Button>
        </form>
      </div>
    </div>
  );
}
