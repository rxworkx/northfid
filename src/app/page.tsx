import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  ChevronRight, Shield, TrendingUp, Globe,
  BookOpen, Headphones, CheckCircle2, Trophy,
  BarChart3, Users, Zap, ArrowUpRight, Lock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const BTN: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e1e1e 0%, #2b1a0c 100%)",
  color: "#ffffff",
  border: "1px solid rgba(240,112,32,0.28)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 14px rgba(0,0,0,0.5)",
};

const ICON_BOX: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const HOVER_LINE = "absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

const STEP_NUM: React.CSSProperties = {
  background: "linear-gradient(135deg, #f07020 0%, #f8c080 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const STAT_VAL: React.CSSProperties = {
  background: "linear-gradient(135deg, #f07020 0%, #f8c080 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="text-white overflow-x-hidden">

      <Navbar />

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="relative min-h-screen flex items-center pt-20 bg-black" style={{ minHeight: "100svh" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/2 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 w-full pt-28 pb-16">
          <div className="relative grid lg:grid-cols-[62%_38%] gap-8 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
                <span className="text-white">Become a Lead Trader</span><br />
                <span style={{ background: "linear-gradient(90deg, #f07020 0%, #f8c080 60%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } as React.CSSProperties}>
                  or just copy one
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
                8 years on the market, invest in 1000+ assets, get free education, pro tools and a personal account manager. Try it now!
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-base px-8 py-3 transition-opacity hover:opacity-90" style={BTN}>
                  Start Trading
                </Link>
                <Link href="/dashboard/academy" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mt-2 sm:mt-0 sm:pt-3 transition-colors">
                  Free access to learning
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Excellent</span>
                <Image src="/media/stars-4.5.svg" alt="4.5 stars" width={80} height={16} />
              </div>
              <div className="mt-5 flex items-center gap-4 border border-white/10 rounded-xl p-4 bg-white/3 max-w-md">
                <Image src="/media/frankfurt.webp" alt="Frankfurt Stock Exchange" width={76} height={68} className="shrink-0 object-contain" />
                <div>
                  <p className="text-sm font-semibold text-white leading-snug">STAY WITH A TRUSTED PARTNER WITH<br />OVER 8 YEARS OF EXPERIENCE ON THE MARKET</p>
                  <p className="text-xs text-slate-500 mt-0.5">Over 8 years of experience</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block absolute right-0 w-[46%] pointer-events-none" style={{ top: "-8%", bottom: "-8%" }}>
              <Image
                src="/media/hero.webp"
                alt="Pipnova trading platform"
                fill
                className="object-contain object-center"
                style={{ transform: "scale(1.12)", transformOrigin: "center center" }}
                priority
              />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8 border border-white/8 rounded-2xl overflow-hidden bg-white/2">
            {[
              { label: "Assets Available", value: "1,000+" },
              { label: "Active Traders", value: "50,000+" },
              { label: "Countries", value: "120+" },
              { label: "Daily Volume", value: "$2.4B+" },
            ].map((s) => (
              <div key={s.label} className="text-center py-5 px-4">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Awards â”€â”€ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-400 mb-4">Platform Excellence</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Award-winning trading experience</h2>
            <p className="mt-3 text-slate-500 text-sm max-w-xl mx-auto">Recognised globally for performance, innovation, and trader-first values</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Trophy, title: "Industry Awards", desc: "Pipnova platform holds multiple industry awards as the best trading platform." },
              { Icon: BarChart3, title: "1000+ Assets", desc: "Commodities, Stocks, Futures, Indices and a lot more to choose from." },
              { Icon: Users, title: "Demo Account", desc: "Register and get access to the demo account with $10,000 test funds." },
              { Icon: Headphones, title: "24/5 Support", desc: "Dedicated customer support is ready to help you whenever you need." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="mb-5 h-11 w-11 rounded-xl flex items-center justify-center bg-slate-100 border border-slate-200">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Assets â”€â”€ */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-400 mb-4">1000+ Markets</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Invest in what you want,<br className="hidden sm:block" /> we provide the options you need
            </h2>
            <p className="mt-3 text-slate-500 text-sm max-w-2xl mx-auto">
              Enjoy a diverse variety of trading assets at Pipnova with more than 1000 trading assets available
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "ETFs", img: "/media/1.webp" },
              { label: "Commodities", img: "/media/2.webp" },
              { label: "Indices", img: "/media/3.webp" },
              { label: "Stocks", img: "/media/4.webp" },
            ].map((asset) => (
              <div key={asset.label} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300" style={{ height: "300px" }}>
                <Image src={asset.img} alt={asset.label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2.5 py-1 rounded-md border border-white/15 backdrop-blur-sm">{asset.label}</span>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg text-white font-semibold px-7 py-3 bg-black hover:bg-[#1a1a1a] transition-colors">
              Create an account <ChevronRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-sm text-slate-400">Register within minutes</p>
          </div>
        </div>
      </section>

      {/* â”€â”€ Testimonials â”€â”€ */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">Trustpilot Reviews</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">We are as good as our clients say</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Image src="/media/stars-4.5.svg" alt="4.5 stars" width={100} height={20} />
              <span className="text-sm text-slate-500">4.5 out of 5 Â· 2,400+ reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "La copia de operaciones de Pipnova.â€¦", text: "La copia de operaciones de Traders Tribe es una de las funciones mÃ¡s sencillas y rentables de ..", name: "Javier R", date: "Feb 02, 2023", init: "J" },
              { title: "piattaforma di trading perfetta", text: "piattaforma di trading perfetta, e sopratutto il servizio di consulenza e di supporto ..", name: "Simone Liberanome", date: "March 09, 2023", init: "S" },
              { title: "Esther", text: "Esther, amabilidad, paciencia, educaciÃ³n. Una buena experiencia con el equipo de soporte.", name: "Thomas", date: "March 11, 2023", init: "T" },
              { title: "Ho avuto un ottima esperien", text: "Ho avuto un ottima esperienza con Nino che mi ha supportato per la verifica del mio pro ...", name: "Kelvin Napoli", date: "April 19, 2023", init: "K" },
            ].map((t) => (
              <div key={t.name} className="group relative rounded-2xl border border-white/8 bg-[#141414] p-6 hover:border-white/16 transition-all duration-300 flex flex-col overflow-hidden">
                <div className={HOVER_LINE} />
                <div className="absolute top-4 right-5 text-7xl font-serif text-white/5 leading-none select-none pointer-events-none">&ldquo;</div>
                <Image src="/media/stars-4.5.svg" alt="4.5 stars" width={80} height={16} className="mb-4 shrink-0" />
                <p className="text-sm font-semibold text-white mb-2 leading-snug">{t.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{t.text}</p>
                <div className="mt-5 pt-4 border-t border-white/8 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                    {t.init}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">{t.name}</p>
                    <p className="text-xs text-slate-600">{t.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Get Started Steps â”€â”€ */}
      <section className="py-24 bg-black border-t border-white/6 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 relative">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Start trading in 3 simple steps</h2>
            <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">Get up and running in minutes. No experience required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-14 left-[calc(33%+3rem)] right-[calc(33%+3rem)] h-px bg-linear-to-r from-transparent via-white/12 to-transparent" />
            {[
              { num: "01", Icon: Users, title: "Create your account", desc: "Sign up in under 2 minutes. No credit card required. Verify your email and you're ready to go." },
              { num: "02", Icon: TrendingUp, title: "Fund your wallet", desc: "Deposit using crypto or bank transfer. Funds reflect instantly so you can start trading right away." },
              { num: "03", Icon: BarChart3, title: "Trade or copy a pro", desc: "Pick an asset and trade manually, or browse expert traders and copy their moves automatically." },
            ].map(({ num, Icon, title, desc }) => (
              <div key={num} className="group relative rounded-2xl border border-white/8 bg-[#111111] p-8 hover:border-white/18 transition-all duration-300 overflow-hidden">
                <div className={HOVER_LINE} />
                <p className="text-[5rem] font-black leading-none mb-1 select-none" style={STEP_NUM}>{num}</p>
                <div className="mb-5 h-11 w-11 rounded-xl flex items-center justify-center" style={ICON_BOX}>
                  <Icon className="h-5 w-5 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg font-semibold px-8 py-3.5 transition-opacity hover:opacity-80 text-white" style={BTN}>
              Open an Account <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Copy Trading â”€â”€ */}
      <section className="py-24 bg-black">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">Copy Trading</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Meet Copy Trading with Pipnova</h2>
            <p className="mt-3 text-slate-400">Benefit from the wisdom of the community</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-16">
            {[
              { img: "/media/item-1.webp", label: "Revenue made by our top 10 traders", value: "$415,842", sub: "In April 2023" },
              { img: "/media/item-2.webp", label: "Average success ratio of top 10 traders", value: "90.90%", sub: "Past performance is not an indication for future results" },
            ].map((s) => (
              <div key={s.label} className="group relative rounded-2xl bg-[#111111] border border-white/8 p-7 flex items-center gap-6 hover:border-white/16 transition-all duration-300 overflow-hidden">
                <div className={HOVER_LINE} />
                <div className="bg-white rounded-xl p-2 shrink-0 shadow-lg">
                  <Image src={s.img} alt={s.label} width={72} height={96} className="object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">{s.label}</p>
                  <p className="text-4xl font-black" style={STAT_VAL}>{s.value}</p>
                  <p className="mt-2 text-xs text-slate-600">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How does Autocopy Trading work?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { num: "1", title: "Pick a Trader", desc: "Find a trader you like and make sure to check if the risk score suits you", video: "/media/hctw-1.mp4" },
              { num: "2", title: "Set the amount", desc: "Choose if you want to invest relative or a fixed amount per each trade", video: "/media/hctw-2.mp4" },
              { num: "3", title: 'Click "Copy" to start', desc: "Begin mirroring the strategies of other traders automatically in real-time", video: "/media/hctw-3.mp4" },
            ].map((step) => (
              <div key={step.num} className="group relative rounded-2xl bg-[#111111] border border-white/8 p-5 hover:border-white/16 transition-all duration-300 overflow-hidden">
                <div className={HOVER_LINE} />
                <div className="mb-5 rounded-xl overflow-hidden border border-white/6">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video autoPlay muted loop playsInline className="w-full h-48 object-cover">
                    <source src={step.video} type="video/mp4" />
                  </video>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-300 shrink-0" style={ICON_BOX}>
                    {step.num}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg text-white font-semibold px-8 py-3.5 transition-opacity hover:opacity-90" style={BTN}>
              Try Copy Trading <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Platforms â”€â”€ */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-400 mb-4">Trading Platforms</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Trade on any device, anywhere</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto text-sm">
              Our user-friendly mobile apps for iOS and Android, as well as our web app, make it easy for you to access your account and trade on the go.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {[
              {
                name: "Pipnova Mobile",
                desc: "Enjoy Pipnova trading experience with our responsive and adaptive mobile features",
                features: ["iOS & Android", "Real-time charts", "Push notifications", "Biometric login"],
              },
              {
                name: "Pipnova Web",
                desc: "Trade from your desktops, iPads and Mac PC with the full suite of professional tools.",
                features: ["Advanced charting", "One-click trading", "Full account control", "Multi-screen"],
              },
            ].map((p) => (
              <div key={p.name} className="group rounded-2xl border border-slate-200 bg-slate-50 p-7 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <Image src="/media/logo3.png" alt="Pipnova" width={52} height={52} className="shrink-0 rounded-xl" />
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 border-t border-slate-200 pt-5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Regulation & Security â”€â”€ */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-400 mb-5">Regulation &amp; Trust</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">Regulated, trusted<br />and transparent</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Pipnova Capital Ltd is authorised and regulated by the Financial Services Authority of Seychelles (FSA) under licence No. SD026. The Pipnova Group AG is publicly listed on the Frankfurt Stock Exchange. We operate with full transparency so you always know where your money is.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon: Shield, label: "FSA Regulated", sub: "Seychelles licence SD026" },
                  { Icon: Trophy, label: "Frankfurt Listed", sub: "WKN: A161NR" },
                  { Icon: Lock, label: "Segregated Funds", sub: "Your money, protected" },
                  { Icon: CheckCircle2, label: "SSL Encrypted", sub: "Bank-grade security" },
                ].map(({ Icon, label, sub }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                    </div>
                    <p className="text-xs text-slate-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "8+", label: "Years in operation" },
                { value: "120+", label: "Countries served" },
                { value: "50K+", label: "Active traders" },
                { value: "$2.4B+", label: "Monthly volume" },
                { value: "1000+", label: "Tradeable assets" },
                { value: "24/5", label: "Customer support" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 text-center hover:border-slate-300 hover:shadow-sm transition-all duration-300">
                  <p className="text-3xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ bg.webp showcase â”€â”€ */}
      <section className="bg-black py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="relative rounded-2xl overflow-hidden border border-white/6" style={{ height: "320px" }}>
            <Image src="/media/bg.webp" alt="Pipnova Platform" fill className="object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* â”€â”€ Why Pipnova â”€â”€ */}
      <section className="py-24 bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-4">Built for Traders</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Why traders choose Pipnova</h2>
            <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">Built for both beginners and seasoned professionals. Everything you need, nothing you don&apos;t.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Featured tall card */}
            <div className="group relative lg:row-span-2 rounded-2xl border border-white/8 bg-[#141414] p-8 hover:border-white/18 transition-all duration-300 flex flex-col overflow-hidden">
              <div className={HOVER_LINE} />
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6" style={ICON_BOX}>
                <Shield className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Segregated Funds &amp; Bank-Grade Security</h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">
                Your funds are held in fully segregated accounts, completely separate from company operating funds. Bank-grade SSL encryption protects every transaction and personal detail. We take your security as seriously as your trading.
              </p>
              <div className="mt-8 pt-6 border-t border-white/8 space-y-2.5">
                {[
                  "FSA Seychelles Regulated (SD026)",
                  "256-bit SSL encryption",
                  "Frankfurt Stock Exchange listed",
                  "Negative balance protection",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 4 smaller cards */}
            {[
              { Icon: Zap, title: "Lightning Execution", desc: "Trades execute in milliseconds with no slippage. Your orders are filled at the exact price you see." },
              { Icon: BarChart3, title: "Advanced Charting", desc: "Professional TradingView charts with 100+ indicators, drawing tools and multi-timeframe analysis." },
              { Icon: Globe, title: "Trade Anywhere", desc: "Seamlessly switch between mobile, tablet and desktop. Your account travels with you." },
              { Icon: BookOpen, title: "Free Academy", desc: "Hundreds of video lessons, webinars and market analysis articles. Learn at your own pace." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group relative rounded-2xl border border-white/8 bg-[#141414] p-6 hover:border-white/18 transition-all duration-300 overflow-hidden">
                <div className={HOVER_LINE} />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={ICON_BOX}>
                  <Icon className="h-5 w-5 text-slate-300" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
            {/* Full-width bottom card */}
            <div className="group relative lg:col-span-3 rounded-2xl border border-white/8 bg-[#141414] p-6 hover:border-white/18 transition-all duration-300 overflow-hidden">
              <div className={HOVER_LINE} />
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0" style={ICON_BOX}>
                  <Headphones className="h-7 w-7 text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Dedicated Account Manager, available 24/5</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Every account gets a personal account manager available to guide your trading journey from day one. Contact us by email, phone, or live chat. We are always here when you need us.</p>
                </div>
                <Link href="/register" className="ml-auto shrink-0 hidden lg:flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap">
                  Get Started <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="py-24 bg-black border-t border-white/6">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.22em] uppercase text-slate-500 mb-6">Get Started Today</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">Ready to start trading?</h2>
          <p className="mt-4 text-slate-400">Join 50,000+ traders already growing their portfolios with Pipnova.</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-lg text-white font-semibold px-8 py-3.5 transition-opacity hover:opacity-90 shadow-lg" style={BTN}>
              Create Account <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/16 text-white font-medium px-8 py-3.5 hover:bg-white/5 transition-colors">
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-600">No credit card required Â· Start with a demo account Â· Upgrade anytime</p>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="bg-black border-t border-white/8 py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/8">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/media/logo3.png" alt="Pipnova" width={48} height={48} />
              <span className="text-2xl font-bold text-white">Pipnova</span>
            </Link>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              {["Privacy Policy", "Terms of Service", "Risk Disclosure", "Contact"].map((item) => (
                <a key={item} href="#" className="hover:text-white transition-colors">{item}</a>
              ))}
            </div>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-300 text-base">Copyright Â© 2023 â€“ All rights reserved.</p>
            <p>
              Pipnova is a trademark of The Pipnova Group AG, a German based FinTech company publicly listed on the Frankfurt Stock Exchange | WKN: A161NR | ISIN: DE000A161NR7.
            </p>
            <p>
              The website is owned by The Pipnova Group AG and operated by Pipnova Capital Ltd which is authorised and regulated by the Financial Services Authority Seychelles (FSA) under licence No. SD026. The registered address of CT House, Office 9A, 2nd Floor, Providence, Mahe, Seychelles.
            </p>
            <p>Tel: ~+2482574498</p>
            <p>
              The group also includes Pipnova Global (CY) Ltd, with registered address at Eurosure Tower, 3rd floor, 2112 Nicosia, Cyprus. Pipnova Global (CY) Ltd is wholly owned by The Pipnova Group AG.
            </p>
            <p>
              <span className="text-slate-400 font-semibold">RISK WARNING: </span>
              Derivatives are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how derivatives work and whether you can afford to take the high risk of losing your money. This is not investment advice. Trading with Pipnova Trader by following and/or copying or replicating the trades of other traders involves high levels of risks, even when following and/or copying or replicating the Lead Traders. Such risks include the risk that you may be following/copying the trading decisions of possibly inexperienced/unprofessional traders, or traders whose ultimate purpose or intention, or financial status may differ from yours. Before making an investment decision, you should rely on your own assessment of the person making the trading decisions and the terms of all the legal documentation.
            </p>
            <p>
              <span className="text-slate-400 font-semibold">Registered countries: </span>
              Pipnova provides services for the residents of certain countries, such as Afghanistan, Albania, American Samoa, Anguilla, Australia, Austria, Barbados, Belarus, Belgium, Benin, Bermuda, British Indian Ocean Territory, Bulgaria, Burkina Faso, Canada, Cayman Islands, Central African Republic, China, Christmas Island, Cocos (Keeling) Islands, Congo, Congo, The Democratic Republic of the, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Falkland Islands (Malvinas), Finland, France, Germany, Gibraltar, Greece, Guam, Haiti, Heard Island and McDonald Islands, Hungary, Iceland, Iran, Islamic Republic of, Ireland, Isle of Man, Israel, Italy, Jamaica, Japan, Jersey, Korea, Democratic People&apos;s Republic of, Latvia, Libyan Arab Jamahiriya, Liechtenstein, Lithuania, Luxembourg, Mali, Malta, Montserrat, Mozambique, Myanmar, Netherlands, New Zealand, Norfolk Island, Norway, Palestinian Territory, Occupied, Pitcairn, Poland, Portugal, Romania, Russian Federation, Saint Helena, Ascension and Tristan Da Cunha, San Marino, Senegal, Serbia, Slovakia, Slovenia, Somalia, South Georgia and the South Sandwich Islands, South Sudan, Spain, Sri Lanka, Sweden, Switzerland, Syrian Arab Republic, Trinidad and Tobago, Tunisia, Turks and Caicos Islands, Uganda, Ukraine, United Kingdom and any other countries where the citizens have British proof of identity (i.e. British Virgin Island, Gibraltar, Isle of Man etc.), United States, U.S. Minor Islands, Vanuatu, Virgin Islands, British, Virgin Islands, U.S., Yemen, and Zimbabwe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
