"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertTriangle, DollarSign, Users, Globe } from "lucide-react";

interface Settings {
  id: string;
  minimumDeposit: number;
  maximumDeposit: number;
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  referralCommission: number;
  siteName: string;
  maintenanceMode: boolean;
}


export function AdminSettingsClient({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    minimumDeposit: String(settings.minimumDeposit),
    maximumDeposit: String(settings.maximumDeposit),
    minimumWithdrawal: String(settings.minimumWithdrawal),
    maximumWithdrawal: String(settings.maximumWithdrawal),
    referralCommission: String(settings.referralCommission),
    siteName: settings.siteName,
    maintenanceMode: settings.maintenanceMode,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");


  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSaveMsg("Settings saved successfully"); router.refresh(); }
    else setSaveMsg("Failed to save settings");
  }

  const inputCls = "w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 transition-colors";

  return (
    <main className="flex-1 p-6 space-y-6 max-w-4xl">
      {/* General Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Globe className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">General</h2>
            <p className="text-xs text-slate-500">Site name and maintenance mode</p>
          </div>
        </div>
        <form onSubmit={saveSettings} className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Site Name</label>
              <input value={form.siteName} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))} className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.maintenanceMode ? "bg-amber-500" : "bg-slate-200"}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.maintenanceMode ? "translate-x-4" : ""}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Disables user access to the platform</p>
                </div>
              </label>
            </div>
          </div>

          {form.maintenanceMode && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">Maintenance mode is active. Users will see a maintenance page when they visit the platform.</p>
            </div>
          )}

          {/* Finance Settings */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Finance Limits</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label: "Minimum Deposit (USD)", k: "minimumDeposit" },
                { label: "Maximum Deposit (USD)", k: "maximumDeposit" },
                { label: "Minimum Withdrawal (USD)", k: "minimumWithdrawal" },
                { label: "Maximum Withdrawal (USD)", k: "maximumWithdrawal" },
              ].map(({ label, k }) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input type="number" step="0.01" min="0" value={(form as any)[k]} onChange={(e) => setForm((f: any) => ({ ...f, [k]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Referral */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Referral Program</p>
            </div>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Commission Rate (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.referralCommission} onChange={(e) => setForm((f) => ({ ...f, referralCommission: e.target.value }))} className={inputCls} />
              <p className="text-xs text-slate-400 mt-1.5">Percentage of deposit credited to the referrer</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
            </button>
            {saveMsg && (
              <span className={`text-sm font-medium ${saveMsg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>{saveMsg}</span>
            )}
          </div>
        </form>
      </div>

    </main>
  );
}
