import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white grid lg:grid-cols-2">

      {/* â”€â”€ Left panel (desktop only) â”€â”€ */}
      <div className="hidden lg:flex flex-col justify-between bg-[#080808] border-r border-white/8 p-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(240,112,32,0.04) 0%, transparent 70%)" }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image src="/media/logo3.png" alt="Northfid" width={40} height={40} />
          <span className="text-xl font-bold text-white tracking-tight">Northfid</span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 my-auto">
          <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-5">The smarter way to trade</p>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-5">
            Trade smarter,<br />
            <span style={{ background: "linear-gradient(90deg, #f07020 0%, #f8c080 60%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              copy the best.
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-10">
            Join 50,000+ traders on the world's most advanced copy trading platform. Invest in 1,000+ assets with professional tools, free education, and a personal account manager.
          </p>

          {/* Trust points */}
          <div className="space-y-3 mb-10">
            {[
              "8 years of trusted trading experience",
              "FSA Seychelles regulated, licence SD026",
              "Publicly listed on Frankfurt Stock Exchange",
              "Funds held in segregated accounts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-400">{item}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/8 pt-8">
            {[
              { value: "50K+", label: "Active traders" },
              { value: "1,000+", label: "Assets" },
              { value: "120+", label: "Countries" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Frankfurt badge */}
        <div className="flex items-center gap-3 border border-white/8 rounded-xl p-4 bg-white/2 relative z-10">
          <Image src="/media/frankfurt.webp" alt="Frankfurt Stock Exchange" width={52} height={46} className="shrink-0 object-contain" />
          <div>
            <p className="text-xs font-semibold text-white leading-snug">Member of Northfid Group AG</p>
            <p className="text-xs text-slate-500 mt-0.5">Publicly listed on Frankfurt Stock Exchange</p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Right panel â”€â”€ */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-white/8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/media/logo3.png" alt="Northfid" width={32} height={32} />
            <span className="text-lg font-bold text-white">Northfid</span>
          </Link>
        </div>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          {children}
        </main>

        <footer className="py-5 text-center text-xs text-slate-700 border-t border-white/6">
          Â© {new Date().getFullYear()} Northfid Group AG Â· Frankfurt Stock Exchange
        </footer>
      </div>

    </div>
  );
}
