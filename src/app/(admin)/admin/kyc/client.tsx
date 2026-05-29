"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

interface Kyc {
  id: string; status: string; docType: string | null; docNumber: string | null;
  firstName: string | null; lastName: string | null; dateOfBirth: string | null;
  nationality: string | null; addressLine1: string | null; city: string | null;
  country: string | null; docFront: string | null; docBack: string | null;
  rejectionReason: string | null; reviewedAt: string | null; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; username: string };
}

interface Props {
  kycs: Kyc[];
  total: number; page: number; pages: number;
  currentStatus: string; search: string;
  counts: { pending: number; approved: number; rejected: number };
}

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-500",
};

const TABS = [
  { value: "pending", label: "Pending", key: "pending" },
  { value: "approved", label: "Approved", key: "approved" },
  { value: "rejected", label: "Rejected", key: "rejected" },
  { value: "", label: "All", key: "all" },
];

export function AdminKycClient({ kycs, total, page, pages, currentStatus, search, counts }: Props) {
  const router = useRouter();
  const [viewKyc, setViewKyc] = useState<Kyc | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: string, reason?: string) {
    setUpdating(id);
    await fetch(`/api/admin/kyc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason: reason }),
    });
    setUpdating(null);
    setViewKyc(null);
    setShowReject(false);
    setRejectionReason("");
    router.refresh();
  }

  return (
    <main className="flex-1 p-6 space-y-5">
      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        {TABS.map((tab) => {
          const count = tab.key === "all" ? undefined : (counts as any)[tab.key];
          const isActive = currentStatus === tab.value;
          return (
            <button key={tab.value}
              onClick={() => { const p = new URLSearchParams(); if (tab.value) p.set("status", tab.value); router.push(`/admin/kyc?${p.toString()}`); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {["User", "Doc Type", "Name on Doc", "Country", "Submitted", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {kycs.map((kyc) => (
                <tr key={kyc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/users/${kyc.user.id}`} className="font-medium text-slate-800 hover:text-slate-900 transition-colors">{kyc.user.firstName} {kyc.user.lastName}</Link>
                    <p className="text-xs text-slate-400">{kyc.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-slate-600">{kyc.docType?.replace("_", " ") ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-700">{kyc.firstName || kyc.lastName ? `${kyc.firstName} ${kyc.lastName}` : "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{kyc.country ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(kyc.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CHIP[kyc.status] ?? "bg-slate-100 text-slate-600"}`}>{kyc.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewKyc(kyc)} className="h-7 px-3 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {kyc.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(kyc.id, "approved")} disabled={updating === kyc.id}
                            className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-60">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setViewKyc(kyc); setShowReject(true); }} disabled={updating === kyc.id}
                            className="h-7 w-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-60">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {kycs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">No KYC submissions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 flex-wrap gap-2">
            <p className="text-xs text-slate-500">Page {page} of {pages} ({total} total)</p>
            <div className="flex items-center gap-1 flex-wrap">
              {page > 1 && <Link href={`/admin/kyc?status=${currentStatus}&page=${page - 1}`} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-600" /></Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/admin/kyc?status=${currentStatus}&page=${p}`}
                  className={`h-8 min-w-8 px-2 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${p === page ? "bg-black text-white border-black" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}>
                  {p}
                </Link>
              ))}
              {page < pages && <Link href={`/admin/kyc?status=${currentStatus}&page=${page + 1}`} className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"><ChevronRight className="h-4 w-4 text-slate-600" /></Link>}
            </div>
          </div>
        )}
      </div>

      {/* View KYC Modal */}
      {viewKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">KYC Submission</h2>
                <p className="text-sm text-slate-500">{viewKyc.user.firstName} {viewKyc.user.lastName} · {viewKyc.user.email}</p>
              </div>
              <button onClick={() => { setViewKyc(null); setShowReject(false); setRejectionReason(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Document Type", value: viewKyc.docType?.replace("_", " ") ?? "—" },
                  { label: "Document Number", value: viewKyc.docNumber ?? "—" },
                  { label: "Full Name", value: `${viewKyc.firstName ?? ""} ${viewKyc.lastName ?? ""}`.trim() || "—" },
                  { label: "Date of Birth", value: viewKyc.dateOfBirth ?? "—" },
                  { label: "Nationality", value: viewKyc.nationality ?? "—" },
                  { label: "Country", value: viewKyc.country ?? "—" },
                  { label: "City", value: viewKyc.city ?? "—" },
                  { label: "Address", value: viewKyc.addressLine1 ?? "—" },
                  { label: "Submitted", value: formatDateTime(viewKyc.createdAt) },
                  { label: "Status", value: viewKyc.status },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{value}</p>
                  </div>
                ))}
              </div>

              {(viewKyc.docFront || viewKyc.docBack) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Document Images</p>
                  <div className="grid grid-cols-2 gap-3">
                    {viewKyc.docFront && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Front</p>
                        <img src={viewKyc.docFront} alt="Doc front" className="w-full rounded-xl border border-slate-200 object-cover max-h-48" />
                      </div>
                    )}
                    {viewKyc.docBack && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Back</p>
                        <img src={viewKyc.docBack} alt="Doc back" className="w-full rounded-xl border border-slate-200 object-cover max-h-48" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewKyc.rejectionReason && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{viewKyc.rejectionReason}</p>
                </div>
              )}

              {showReject && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rejection Reason</label>
                  <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="Explain why the document was rejected..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 resize-none" />
                </div>
              )}

              {viewKyc.status === "pending" && (
                <div className="flex gap-3">
                  {!showReject ? (
                    <>
                      <button onClick={() => updateStatus(viewKyc.id, "approved")} disabled={updating === viewKyc.id}
                        className="flex-1 h-10 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button onClick={() => setShowReject(true)}
                        className="flex-1 h-10 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => updateStatus(viewKyc.id, "rejected", rejectionReason)} disabled={updating === viewKyc.id}
                        className="flex-1 h-10 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60">
                        Confirm Rejection
                      </button>
                      <button onClick={() => setShowReject(false)} className="h-10 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
