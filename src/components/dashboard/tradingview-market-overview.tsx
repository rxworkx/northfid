import { TradingViewWidget } from "./tradingview-widget";

const TICKER_CONFIG = {
  symbols: [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "FOREXCOM:NSXUSD", title: "US 100" },
    { proName: "FOREXCOM:DJI", title: "Dow 30" },
    { proName: "FX:EURUSD", title: "EUR/USD" },
    { proName: "FX:GBPUSD", title: "GBP/USD" },
    { proName: "FX:USDJPY", title: "USD/JPY" },
    { proName: "FX:USDCHF", title: "USD/CHF" },
    { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
    { proName: "BITSTAMP:ETHUSD", title: "ETH/USD" },
    { proName: "BINANCE:SOLUSDT", title: "SOL/USDT" },
    { proName: "COMEX:GC1!", title: "Gold" },
    { proName: "NYMEX:CL1!", title: "Crude Oil" },
  ],
  showSymbolLogo: true,
  colorTheme: "light",
  isTransparent: true,
  displayMode: "adaptive",
  locale: "en",
};

export function TradingViewMarketOverview() {
  return (
    <TradingViewWidget
      src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      config={TICKER_CONFIG}
    />
  );
}
