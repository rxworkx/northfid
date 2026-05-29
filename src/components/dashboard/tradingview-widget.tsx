"use client";

import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  src: string;
  config: Record<string, unknown>;
}

export function TradingViewWidget({ src, config }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.async = true;
    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [src, config]);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}
