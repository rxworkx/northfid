import { TradingViewWidget } from "@/components/dashboard/tradingview-widget";
import { TrendingUp } from "lucide-react";

export const metadata = { title: "Economic Calendar" };

const EVENTS_CONFIG = {
  colorTheme: "light",
  isTransparent: false,
  width: "100%",
  height: 700,
  locale: "en",
  importanceFilter: "-1,0,1",
  countryFilter: "us,eu,gb,jp,au,ca,ch",
};

export default function EconomicCalendarPage() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl bg-black p-6 text-white relative overflow-hidden"
      >
        <div className="relative flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Economic Calendar</h1>
            <p className="text-sm text-white/50 mt-0.5">Upcoming economic events that move markets, filtered by impact level</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
        <TradingViewWidget
          src="https://s3.tradingview.com/external-embedding/embed-widget-events.js"
          config={EVENTS_CONFIG}
        />
      </div>
    </div>
  );
}
