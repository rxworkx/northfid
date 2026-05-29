"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";

export function CryptoAddressQR({ address, symbol }: { address: string; symbol?: string | null }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div className="shrink-0 p-3 bg-white border border-slate-200 rounded-xl">
        <QRCodeSVG value={address} size={120} bgColor="#ffffff" fgColor="#0f172a" level="M" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-xs text-slate-500">{symbol ? `${symbol} wallet address` : "Wallet address"}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 font-mono text-xs text-slate-700 break-all select-all">
            {address}
          </div>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-slate-400">Scan the QR code or copy the address to send payment.</p>
      </div>
    </div>
  );
}
