"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Bell, Plus, ChevronLeft, ChevronRight, Search, Mail, Loader2, Users, AtSign, Trash2 } from "lucide-react";
import Link from "next/link";

const TYPE_OPTIONS = [
  { value: "announcement", label: "Announcement" },
  { value: "welcome", label: "Welcome" },
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "trade_closed", label: "Trade Closed" },
  { value: "new_login", label: "New Login" },
];

const TYPE_CHIP: Record<string, string> = {
  announcement: "bg-slate-100 text-slate-700",
  welcome: "bg-emerald-100 text-emerald-700",
  deposit: "bg-teal-100 text-teal-700",
  withdrawal: "bg-amber-100 text-amber-700",
  trade_closed: "bg-purple-100 text-purple-700",
  new_login: "bg-slate-100 text-slate-600",
};

type DeliveryMode = "email" | "notification" | "both";
type RecipientMode = "all" | "user" | "custom";

const DELIVERY_CHIP: Record<string, { label: string; cls: string }> = {
  email:        { label: "Email",        cls: "bg-slate-100 text-slate-700" },
  notification: { label: "In-app",       cls: "bg-slate-100 text-slate-600" },
  both:         { label: "Email + App",  cls: "bg-purple-100 text-purple-700" },
};

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  delivery: string;
  createdAt: string;
  recipientCount: number;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  rows: NotifRow[];
  total: number;
  page: number;
  pages: number;
  users: UserOption[];
}

export function AdminNotificationsClient({ rows, total, page, pages, users }: Props) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this notification batch for all recipients?")) return;
    setDeleting(id);
    await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  const [form, setForm] = useState({
    recipient: "user" as RecipientMode,
    userId: "",
    customEmail: "",
    type: "announcement",
    title: "",
    body: "",
    href: "",
    delivery: "email" as DeliveryMode,
  });

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const sendEmail = form.delivery === "email" || form.delivery === "both";
    const sendNotification = form.delivery === "notification" || form.delivery === "both";

    const payload: any = {
      type: form.type,
      title: form.title,
      body: form.body,
      href: form.href,
      sendEmail,
      sendNotification,
    };
    if (form.recipient === "user" && form.userId) {
      payload.userId = form.userId;
    } else if (form.recipient === "custom" && form.customEmail) {
      payload.customEmail = form.customEmail;
    }

    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setResult("Failed to send");
      return;
    }

    const parts: string[] = [];
    if (data.emailsSent != null) parts.push(`${data.emailsSent} email${data.emailsSent !== 1 ? "s" : ""}`);
    if (data.notificationsSent != null) parts.push(`${data.notificationsSent} in-app notification${data.notificationsSent !== 1 ? "s" : ""}`);
    setResult(`Sent: ${parts.join(" + ")}`);
    setShowCompose(false);
    setForm({ recipient: "user", userId: "", customEmail: "", type: "announcement", title: "", body: "", href: "", delivery: "email" });
    setUserSearch("");
    router.refresh();
  }

  const selectedUser = users.find((u) => u.id === form.userId);

  const deliveryOptions: { value: DeliveryMode; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: "email", label: "Email only", desc: "Send via Resend", icon: <Mail className="h-4 w-4" /> },
    { value: "both", label: "Email + In-app", desc: "Both channels", icon: <><Mail className="h-3.5 w-3.5" /><Bell className="h-3.5 w-3.5" /></> },
    { value: "notification", label: "In-app only", desc: "Dashboard bell", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <main className="flex-1 p-6 space-y-5">
      {result && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{result}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{total} notifications sent</p>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 transition-colors"
        >
          <Plus className="h-4 w-4" /> Compose
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Notification</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Delivery</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Recipient</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Sent</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    {(() => {
                      const customMatch = n.title.match(/^\[→ (.+?)\] (.+)$/);
                      const displayTitle = customMatch ? customMatch[2] : n.title;
                      return (
                        <>
                          <p className="font-medium text-slate-800 truncate max-w-xs">{displayTitle}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{n.body}</p>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_CHIP[n.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {n.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {(() => { const d = DELIVERY_CHIP[n.delivery] ?? DELIVERY_CHIP.notification; return (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${d.cls}`}>{d.label}</span>
                    ); })()}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {(() => {
                      const customMatch = n.title.match(/^\[→ (.+?)\] /);
                      if (customMatch) {
                        return (
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Custom email</p>
                            <p className="text-xs text-slate-400">{customMatch[1]}</p>
                          </div>
                        );
                      }
                      if (n.recipientCount > 1) {
                        return <p className="text-sm text-slate-600 font-medium">{n.recipientCount} recipients</p>;
                      }
                      return (
                        <div>
                          <p className="text-sm text-slate-700">{n.user.firstName} {n.user.lastName}</p>
                          <p className="text-xs text-slate-400">{n.user.email}</p>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-500">{formatDate(n.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={deleting === n.id}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      {deleting === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Bell className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                    No notifications sent yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && (
                <Link href={`/admin/notifications?page=${page - 1}`}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/admin/notifications?page=${p}`}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && (
                <Link href={`/admin/notifications?page=${page + 1}`}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Compose</h2>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              {/* Delivery mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Delivery</label>
                <div className="grid grid-cols-3 gap-2">
                  {deliveryOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, delivery: opt.value }))}
                      className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-colors ${
                        form.delivery === opt.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <span className={`flex items-center gap-0.5 ${form.delivery === opt.value ? "text-white" : "text-slate-400"}`}>
                        {opt.icon}
                      </span>
                      <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                      <span className={`text-[10px] leading-tight ${form.delivery === opt.value ? "text-slate-300" : "text-slate-400"}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Recipients</label>
                <div className="flex gap-2 mb-3">
                  {([
                    { value: "user", label: "Specific User", icon: <Search className="h-3.5 w-3.5" /> },
                    { value: "custom", label: "Custom Email", icon: <AtSign className="h-3.5 w-3.5" /> },
                    { value: "all", label: "All Users", icon: <Users className="h-3.5 w-3.5" /> },
                  ] as { value: RecipientMode; label: string; icon: React.ReactNode }[]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, recipient: opt.value, userId: "", customEmail: "" }))}
                      className={`flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                        form.recipient === opt.value
                          ? "bg-black text-white border-black"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>

                {form.recipient === "user" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white"
                      />
                    </div>
                    {selectedUser && (
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-slate-700 font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                        <span className="text-slate-400 text-xs">{selectedUser.email}</span>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, userId: "" }))} className="ml-2 text-slate-400 hover:text-slate-600 text-xs">×</button>
                      </div>
                    )}
                    {!selectedUser && userSearch && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        {filteredUsers.slice(0, 8).map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => { setForm((f) => ({ ...f, userId: u.id })); setUserSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-700">{u.firstName} {u.lastName}</span>
                            <span className="text-slate-400 text-xs">{u.email}</span>
                          </button>
                        ))}
                        {filteredUsers.length === 0 && <p className="text-sm text-slate-400 px-3 py-2">No users found</p>}
                      </div>
                    )}
                  </div>
                )}

                {form.recipient === "custom" && (
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={form.customEmail}
                      onChange={(e) => setForm((f) => ({ ...f, customEmail: e.target.value }))}
                      placeholder="recipient@example.com"
                      className="w-full h-9 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                )}

                {form.recipient === "all" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    This will send to all registered users.
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Notification message..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white resize-none"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Action Link</label>
                <input
                  value={form.href}
                  onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                  placeholder="/dashboard"
                  className="w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="h-9 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || (form.recipient === "user" && !form.userId) || (form.recipient === "custom" && !form.customEmail)}
                  className="flex items-center gap-2 h-9 px-5 text-sm font-semibold text-white rounded-lg bg-black hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
