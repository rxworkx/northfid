import { TradingViewWidget } from "@/components/dashboard/tradingview-widget";
import { BarChart2 } from "lucide-react";

export const metadata = { title: "Instruments" };

const SCREENER_CONFIG = {
  width: "100%",
  height: 700,
  defaultColumn: "overview",
  defaultScreen: "general",
  market: "forex",
  showToolbar: true,
  colorTheme: "light",
  locale: "en",
};

export default function InstrumentsPage() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl bg-black p-6 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Trading Instruments</h1>
            <p className="text-sm text-white/50 mt-0.5">Live prices across forex, crypto, commodities, and indices</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        <TradingViewWidget
          src="https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
          config={SCREENER_CONFIG}
        />
      </div>
    </div>
  );
}
