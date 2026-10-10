"use client";

import { useState } from "react";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import Detail from "./Detail";
import Markets from "./Markets";
import PortfolioList from "./PortfolioList";
import PortfolioView from "./PortfolioView";
import { usePortfolios } from "./portfolios";
import SymbolSearch from "./SymbolSearch";

type Tab = "market" | "portfolios";
type View = { kind: "home" } | { kind: "stock"; symbol: string; from: View } | { kind: "portfolio"; id: string };

const tabs: { id: Tab; label: string }[] = [
  { id: "market", label: "Stock market" },
  { id: "portfolios", label: "Portfolios" },
];

export default function StocksApp() {
  const { dragProps } = useWindow();
  const store = usePortfolios();
  const [tab, setTab] = useState<Tab>("market");
  const [view, setView] = useState<View>({ kind: "home" });

  const openStock = (symbol: string) => setView({ kind: "stock", symbol, from: view });
  const portfolio = view.kind === "portfolio" ? store.portfolios.find((item) => item.id === view.id) : undefined;

  const back = view.kind === "stock" ? view.from : { kind: "home" as const };
  const backLabel = view.kind === "stock" ? (view.from.kind === "portfolio" ? "Portfolio" : "Markets") : "Portfolios";

  return (
    <div className="@container flex h-full flex-col bg-[#1c1c1e]/95 text-white">
      <div className="flex h-12 shrink-0 items-center gap-4 px-4" {...dragProps}>
        <TrafficLights />
        {view.kind !== "home" && (
          <button type="button" onClick={() => setView(back)} className="text-sm text-[#0a84ff]">
            ‹ {backLabel}
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <SymbolSearch onPick={(hit) => openStock(hit.symbol)} className="shrink-0" />
        {view.kind === "home" && (
          <>
            <div role="tablist" className="mx-auto flex w-full max-w-sm shrink-0 gap-0.5 rounded-xl bg-white/10 p-0.5 text-[13px] font-medium">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex-1 rounded-[10px] py-1.5 ${tab === id ? "bg-white/20" : "text-white/60 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "market" ? (
              <Markets onSelect={openStock} />
            ) : (
              <PortfolioList portfolios={store.portfolios} onOpen={(id) => setView({ kind: "portfolio", id })} onCreate={store.create} />
            )}
          </>
        )}
        {view.kind === "stock" && <Detail key={view.symbol} symbol={view.symbol} />}
        {view.kind === "portfolio" && portfolio && (
          <PortfolioView
            portfolio={portfolio}
            onSelect={openStock}
            onAdd={(position) => store.addPosition(portfolio.id, position)}
            onRemovePosition={(symbol) => store.removePosition(portfolio.id, symbol)}
            onDelete={() => {
              store.remove(portfolio.id);
              setView({ kind: "home" });
            }}
          />
        )}
        <p className="shrink-0 text-center text-[10px] text-white/35">Placeholder data, not real market prices.</p>
      </div>
    </div>
  );
}
