"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/countries";
import {
  Upload, Clock, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  User, MapPin, FileText, Eye, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
}

interface AddressData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface DocData {
  docType: string;
  docNumber: string;
  docIssueDate: string;
  docExpiryDate: string;
  docFront: File | null;
  docBack: File | null;
}

const DOC_TYPES = [
  { value: "passport",         label: "Passport" },
  { value: "drivers_license",  label: "Driver's License" },
  { value: "national_id",      label: "National ID Card" },
  { value: "residence_permit", label: "Residence Permit" },
];

const STEPS = [
  { label: "Personal Info",  icon: User },
  { label: "Address",        icon: MapPin },
  { label: "ID Document",    icon: FileText },
  { label: "Review",         icon: Eye },
];

// ─── File upload drop zone ────────────────────────────────────────────────────

function FileZone({
  label, file, onFile, onClear,
}: { label: string; file: File | null; onFile: (f: File) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(f: File) {
    onFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clear() {
    onClear();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (ref.current) ref.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) pick(f);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src={preview} alt={label} className="w-full max-h-40 object-contain" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 rounded-lg bg-white/90 border border-slate-200 p-1.5 hover:bg-red-50 hover:border-red-200 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-500" />
          </button>
          <div className="px-3 py-2 text-xs text-slate-500 truncate border-t border-slate-100">{file?.name}</div>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
        >
          <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">Click or drag to upload</p>
          <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG or WEBP · Max 8 MB</p>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
      />
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-colors";

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-xs text-slate-500 w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KycVerification({
  kycStatus,
  kycRecord,
  userFirstName,
  userLastName,
}: {
  kycStatus: string;
  kycRecord?: { rejectionReason?: string | null };
  userFirstName?: string;
  userLastName?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [personal, setPersonal] = useState<PersonalData>({
    firstName: userFirstName ?? "",
    lastName: userLastName ?? "",
    dateOfBirth: "",
    nationality: "",
  });

  const [address, setAddress] = useState<AddressData>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [doc, setDoc] = useState<DocData>({
    docType: "",
    docNumber: "",
    docIssueDate: "",
    docExpiryDate: "",
    docFront: null,
    docBack: null,
  });

  // ── Status screens ──────────────────────────────────────────────────────────

  if (kycStatus === "approved") {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Your identity has been verified</span>
      </div>
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <Clock className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Under Review</p>
          <p className="text-xs text-amber-700 mt-0.5">Your documents are being reviewed. This usually takes 1–3 business days.</p>
        </div>
      </div>
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validateStep0() {
    const { firstName, lastName, dateOfBirth, nationality } = personal;
    if (!firstName || !lastName) { toast.error("First and last name are required"); return false; }
    if (!dateOfBirth) { toast.error("Date of birth is required"); return false; }
    if (!nationality) { toast.error("Nationality is required"); return false; }
    return true;
  }

  function validateStep1() {
    const { addressLine1, city, postalCode, country } = address;
    if (!addressLine1) { toast.error("Address line 1 is required"); return false; }
    if (!city) { toast.error("City is required"); return false; }
    if (!postalCode) { toast.error("Postal code is required"); return false; }
    if (!country) { toast.error("Country of residence is required"); return false; }
    return true;
  }

  function validateStep2() {
    const { docType, docNumber, docIssueDate, docExpiryDate, docFront, docBack } = doc;
    if (!docType) { toast.error("Select a document type"); return false; }
    if (!docNumber) { toast.error("Document number is required"); return false; }
    if (!docIssueDate || !docExpiryDate) { toast.error("Document dates are required"); return false; }
    if (new Date(docExpiryDate) <= new Date()) { toast.error("Document must not be expired"); return false; }
    if (!docFront) { toast.error("Front photo of your ID is required"); return false; }
    if (docType !== "passport" && !docBack) { toast.error("Back photo of your ID is required"); return false; }
    return true;
  }

  function next() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function submit() {
    if (!agreed) { toast.error("Please accept the declaration"); return; }
    setSubmitting(true);
    const form = new FormData();
    Object.entries(personal).forEach(([k, v]) => form.append(k, v));
    Object.entries(address).forEach(([k, v]) => form.append(k, v));
    form.append("docType", doc.docType);
    form.append("docNumber", doc.docNumber);
    form.append("docIssueDate", doc.docIssueDate);
    form.append("docExpiryDate", doc.docExpiryDate);
    if (doc.docFront) form.append("docFront", doc.docFront);
    if (doc.docBack)  form.append("docBack",  doc.docBack);

    const res = await fetch("/api/user/verify/kyc", { method: "POST", body: form });
    if (res.ok) {
      toast.success("Verification submitted successfully");
      router.push("/dashboard/verification");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Submission failed. Please try again.");
    }
    setSubmitting(false);
  }

  // ── Step indicator ──────────────────────────────────────────────────────────

  const StepBar = () => (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-emerald-500 border-emerald-500 text-white" :
                active ? "bg-orange-500 border-orange-500 text-white" :
                         "bg-white border-slate-200 text-slate-400"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? "text-orange-600" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Step 0: Personal info ───────────────────────────────────────────────────

  const Step0 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required>
          <input className={inputCls} value={personal.firstName} onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} placeholder="John" />
        </Field>
        <Field label="Last Name" required>
          <input className={inputCls} value={personal.lastName} onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} placeholder="Smith" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" required>
          <input type="date" className={inputCls} value={personal.dateOfBirth} onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Nationality" required>
          <select className={inputCls} value={personal.nationality} onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}>
            <option value="">Select nationality</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );

  // ── Step 1: Residential address ─────────────────────────────────────────────

  const Step1 = () => (
    <div className="space-y-4">
      <Field label="Address Line 1" required>
        <input className={inputCls} value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} placeholder="123 Main Street" />
      </Field>
      <Field label="Address Line 2">
        <input className={inputCls} value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} placeholder="Apt 4B (optional)" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="City" required>
          <input className={inputCls} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="New York" />
        </Field>
        <Field label="State / Province">
          <input className={inputCls} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="NY" />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Postal / ZIP Code" required>
          <input className={inputCls} value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} placeholder="10001" />
        </Field>
        <Field label="Country of Residence" required>
          <select className={inputCls} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}>
            <option value="">Select country</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );

  // ── Step 2: ID document ─────────────────────────────────────────────────────

  const Step2 = () => (
    <div className="space-y-5">
      <Field label="Document Type" required>
        <div className="grid grid-cols-2 gap-2">
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setDoc({ ...doc, docType: dt.value, docBack: dt.value === "passport" ? null : doc.docBack })}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all ${
                doc.docType === dt.value
                  ? "border-orange-400 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Document Number" required>
          <input className={inputCls} value={doc.docNumber} onChange={(e) => setDoc({ ...doc, docNumber: e.target.value })} placeholder="e.g. A12345678" />
        </Field>
        <Field label="Issue Date" required>
          <input type="date" className={inputCls} value={doc.docIssueDate} onChange={(e) => setDoc({ ...doc, docIssueDate: e.target.value })} />
        </Field>
        <Field label="Expiry Date" required>
          <input type="date" className={inputCls} value={doc.docExpiryDate} onChange={(e) => setDoc({ ...doc, docExpiryDate: e.target.value })} />
        </Field>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Document Photos</p>
        <div className={`grid gap-4 ${doc.docType === "passport" ? "grid-cols-1 max-w-sm" : "grid-cols-1 sm:grid-cols-2"}`}>
          <FileZone
            label={doc.docType === "passport" ? "Photo / Bio Page" : "Front Side"}
            file={doc.docFront}
            onFile={(f) => setDoc({ ...doc, docFront: f })}
            onClear={() => setDoc({ ...doc, docFront: null })}
          />
          {doc.docType !== "passport" && (
            <FileZone
              label="Back Side"
              file={doc.docBack}
              onFile={(f) => setDoc({ ...doc, docBack: f })}
              onClear={() => setDoc({ ...doc, docBack: null })}
            />
          )}
        </div>
        <p className="text-xs text-slate-500">
          Ensure all four corners are visible, text is clearly readable, and the photo is not blurry or glared.
        </p>
      </div>
    </div>
  );

  // ── Step 3: Review ──────────────────────────────────────────────────────────

  const docTypeLabel = DOC_TYPES.find((d) => d.value === doc.docType)?.label ?? doc.docType;

  const Step3 = () => (
    <div className="space-y-6">
      {kycStatus === "rejected" && kycRecord?.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Previous Rejection Reason</p>
            <p className="text-xs text-red-700 mt-0.5">{kycRecord.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Personal Information</p>
        <ReviewRow label="Full Name"     value={`${personal.firstName} ${personal.lastName}`} />
        <ReviewRow label="Date of Birth" value={personal.dateOfBirth} />
        <ReviewRow label="Nationality"   value={personal.nationality} />
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Residential Address</p>
        <ReviewRow label="Address"     value={[address.addressLine1, address.addressLine2].filter(Boolean).join(", ")} />
        <ReviewRow label="City"        value={address.city} />
        <ReviewRow label="State"       value={address.state} />
        <ReviewRow label="Postal Code" value={address.postalCode} />
        <ReviewRow label="Country"     value={address.country} />
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Identity Document</p>
        <ReviewRow label="Type"        value={docTypeLabel} />
        <ReviewRow label="Number"      value={doc.docNumber} />
        <ReviewRow label="Issue Date"  value={doc.docIssueDate} />
        <ReviewRow label="Expiry Date" value={doc.docExpiryDate} />
        <ReviewRow label="Front Photo" value={doc.docFront?.name ?? null} />
        {doc.docBack && <ReviewRow label="Back Photo" value={doc.docBack.name} />}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span className="text-sm text-slate-600 leading-relaxed">
          I confirm that all the information and documents provided are genuine, accurate, and belong to me. I understand that submitting false information may result in account suspension.
        </span>
      </label>
    </div>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <StepBar />

      <div className="min-h-[320px]">
        {step === 0 && <Step0 />}
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        ) : <div />}

        {step < 3 ? (
          <Button type="button" onClick={next} className="bg-orange-500 hover:bg-orange-600 text-white">
            Continue <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || !agreed}
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Verification"}
          </Button>
        )}
      </div>
    </div>
  );
}
