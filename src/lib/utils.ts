import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function generateReferralCode(username: string): string {
  return username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 8);
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateRecoveryPhrase(): string {
  const words = [
    "apple", "brave", "cloud", "dance", "eagle", "flame", "grace", "heart",
    "ivory", "jewel", "kings", "light", "maple", "noble", "ocean", "pearl",
    "queen", "river", "stone", "tiger", "ultra", "vivid", "water", "xenon",
    "youth", "zebra", "amber", "blaze", "cedar", "digit",
  ];
  return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(" ");
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50 border-amber-200",
    confirmed: "text-emerald-600 bg-emerald-50 border-emerald-200",
    failed: "text-red-600 bg-red-50 border-red-200",
    active: "text-emerald-600 bg-emerald-50 border-emerald-200",
    approved: "text-emerald-600 bg-emerald-50 border-emerald-200",
    none: "text-slate-600 bg-slate-50 border-slate-200",
  };
  return map[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}
