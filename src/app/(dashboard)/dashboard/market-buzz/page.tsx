import { TradingViewWidget } from "@/components/dashboard/tradingview-widget";
import { Globe } from "lucide-react";

export const metadata = { title: "Market Buzz" };

const TIMELINE_CONFIG = {
  feedMode: "all_symbols",
  isTransparent: false,
  displayMode: "adaptive",
  width: "100%",
  height: 700,
  colorTheme: "light",
  locale: "en",
};

export default function MarketBuzzPage() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl bg-black p-6 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <Globe className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Market Buzz</h1>
            <p className="text-sm text-white/50 mt-0.5">Live financial news, analysis, and market-moving events</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        <TradingViewWidget
          src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
          config={TIMELINE_CONFIG}
        />
      </div>
    </div>
  );
}
