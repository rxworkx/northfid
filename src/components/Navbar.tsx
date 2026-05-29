"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import type React from "react";

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)",
  color: "#ffffff",
  border: "1px solid rgba(240,112,32,0.28)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.5)",
};

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/8">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/media/logo3.png" alt="Pipnova" width={44} height={44} />
          <span className="text-2xl font-bold text-white tracking-tight">Pipnova</span>
        </Link>

        <div className="hidden lg:flex items-center">
          <a href="#" className="text-sm text-slate-400 hover:text-white border border-white/12 px-4 py-2 rounded-md transition-colors leading-tight text-center">
            Member of Pipnova Group AG<br />
            <span className="text-slate-300 font-medium">Publicly listed in Frankfurt</span>
          </a>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/login" className="text-base font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
            Login
          </Link>
          <Link href="/register" className="text-base font-semibold text-white px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90" style={BTN}>
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden border-t border-white/8 bg-black/98 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-white transition-colors py-2.5 border-b border-white/8"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center text-base font-semibold text-white px-5 py-3 rounded-lg transition-opacity hover:opacity-90 mt-1"
              style={BTN}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
