/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MarketIndex } from '../types';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, Globe, ShieldAlert } from 'lucide-react';

interface MarketTickerProps {
  indices: MarketIndex[];
  onRefresh: () => void;
  isLoading: boolean;
  serverMode: 'live' | 'demo' | 'quota_cooldown' | 'demo_fallback';
}

export default function MarketTicker({ indices, onRefresh, isLoading, serverMode }: MarketTickerProps) {
  const [tickerPrices, setTickerPrices] = useState<Record<string, { price: string; color: string }>>({});

  useEffect(() => {
    // Sync indices and apply random micro-fluctuations to emulate actual live market tick updates
    const initial: Record<string, { price: string; color: string }> = {};
    indices.forEach(idx => {
      initial[idx.symbol] = { price: idx.price, color: 'text-gray-300' };
    });
    setTickerPrices(initial);

    const interval = setInterval(() => {
      setTickerPrices(prev => {
        const updated = { ...prev };
        indices.forEach(idx => {
          if (Math.random() > 0.6) {
            // Apply tiny 0.02% tick fluctuation
            const rawVal = parseFloat(idx.price.replace(/[^0-9.]/g, ''));
            if (!isNaN(rawVal) && rawVal > 0) {
              const direction = Math.random() > 0.5 ? 1 : -1;
              const delta = rawVal * (Math.random() * 0.0003) * direction;
              const nextPrice = rawVal + delta;
              const isDollar = idx.price.startsWith('$');
              const formatted = isDollar
                ? `$${nextPrice.toFixed(2)}`
                : idx.symbol === 'INDIAVIX'
                  ? nextPrice.toFixed(2)
                  : nextPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              
              updated[idx.symbol] = {
                price: formatted,
                color: direction > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              };

              // Clear background flash after 600ms
              setTimeout(() => {
                setTickerPrices(curr => {
                  if (curr[idx.symbol]?.price === formatted) {
                    return {
                      ...curr,
                      [idx.symbol]: { price: formatted, color: 'text-gray-300' },
                    };
                  }
                  return curr;
                });
              }, 600);
            }
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [indices]);

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Banner for configuration warnings */}
        <div className="flex items-center gap-2">
          {serverMode === 'demo' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] font-medium text-amber-400 font-mono tracking-tight animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              DEMO MODE: ADD GEMINI_API_KEY TO SECRETS FOR LIVE GROUNDED ANALYSIS
            </div>
          ) : serverMode === 'quota_cooldown' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 border border-rose-550/35 rounded text-[11px] font-bold text-rose-450 font-mono tracking-tight animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              QUOTA COOLDOWN: GEMINI RATE LIMIT MET, RUNNING HIGH-FIDELITY SIMULATION MODE
            </div>
          ) : serverMode === 'demo_fallback' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-550/25 rounded text-[11px] font-medium text-yellow-500 font-mono tracking-tight">
              <ShieldAlert className="w-3.5 h-3.5" />
              API FALLBACK ACTIVE: RUNNING LOCAL HEURISTIC ANALYSIS ENGINES
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] font-medium text-emerald-400 font-mono tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE SYSTEM: BREATHE-GROUNDED MULTI-LAYER COGNITIVE SEARCH ACTIVE
            </div>
          )}
        </div>

        {/* Global Macro Variables & Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto md:max-w-3xl">
          <div className="flex gap-3 shrink-0">
            {indices.map(idx => {
              const current = tickerPrices[idx.symbol] || { price: idx.price, color: 'text-gray-300' };
              const isNegative = idx.changePct < 0;

              return (
                <div
                  key={idx.symbol}
                  id={`index-item-${idx.symbol}`}
                  className={`flex flex-col items-start px-3 py-1.5 rounded-lg border border-slate-800 transition-colors duration-200 shrink-0 bg-slate-950`}
                >
                  <div className="flex items-center gap-1">
                    {idx.isGlobal && <Globe className="w-3 h-3 text-slate-500" />}
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 font-sans uppercase">
                      {idx.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[13px] font-bold font-mono transition-colors duration-300 ${current.color}`}>
                      {current.price}
                    </span>
                    <span className={`text-[10px] font-bold font-mono flex items-center gap-0.5 ${isNegative ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}`}>
                      {isNegative ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                      {idx.changePct > 0 ? '+' : ''}{idx.changePct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refreshes and Action Toggles */}
        <button
          id="btn-refresh-indices"
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg transition-all duration-200 text-xs font-medium shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating...' : 'Sync Live indices'}</span>
        </button>
        
      </div>
    </div>
  );
}
