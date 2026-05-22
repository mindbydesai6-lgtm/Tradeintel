/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScannerItem, SectorStrength } from '../types';
import { 
  Compass, Flame, Zap, Award, ArrowUpRight, TrendingUp, TrendingDown,
  ShieldAlert, RefreshCw, BarChart2, Info
} from 'lucide-react';

interface MarketScannersProps {
  scanners: ScannerItem[];
  isLoading: boolean;
  onRefreshScanners: () => void;
}

export default function MarketScanners({ scanners, isLoading, onRefreshScanners }: MarketScannersProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'BREAKOUT' | 'MOMENTUM_SPIKE' | 'DELIVERY_SPIKE' | 'SMART_MONEY'>('ALL');

  const filteredScanners = selectedCategory === 'ALL'
    ? scanners
    : scanners.filter(item => item.signal === selectedCategory);

  const sectorStrengths: SectorStrength[] = [
    { name: 'Defence & Railway PSUs', score: 92, trend: 'Up', leadingStock: 'HAL / RVNL' },
    { name: 'Financials & Fintech', score: 86, trend: 'Up', leadingStock: 'HDFC BANK' },
    { name: 'EV & Automobile Solutions', score: 79, trend: 'Up', leadingStock: 'TATA MOTORS' },
    { name: 'Renewable & Solar Energy', score: 74, trend: 'Down', leadingStock: 'IREDA' },
    { name: 'PSU Metals & Mining', score: 68, trend: 'Flat', leadingStock: 'TATA STEEL' },
    { name: 'Information Tech (IT)', score: 55, trend: 'Down', leadingStock: 'INFOSYS' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* SECTOR STRENGTH RANKINGS COLUMN */}
      <div className="lg:col-span-4 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-sans">
              Sector Strength Rankings
            </h3>
          </div>
          <span className="text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-800 rounded font-mono text-slate-400 font-bold">
            COGNITIVE SCORES
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {sectorStrengths.map((sec, i) => (
            <div key={sec.name} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between font-sans">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">#{i + 1}</span>
                  <span className="text-[12.5px] font-bold text-slate-200">{sec.name}</span>
                </div>
                <div className="text-[10.5px] text-slate-500">
                  Sector Leader: <span className="text-emerald-400 font-bold font-mono">{sec.leadingStock}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono text-white">{sec.score}%</div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide">MoM momentum</span>
                </div>
                <span className={`p-1.5 rounded-lg border ${
                  sec.trend === 'Up' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : sec.trend === 'Down'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-slate-800/20 border-slate-700/25 text-slate-400'
                }`}>
                  {sec.trend === 'Up' ? <TrendingUp className="w-3.5 h-3.5" /> : sec.trend === 'Down' ? <TrendingDown className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE SCREENER SCANNERS COLUMN */}
      <div className="lg:col-span-8 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-sans">
              Screener & Smart Money Scanners
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshScanners}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-700 hover:border-slate-500 rounded text-[11px] font-sans text-slate-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh scanners</span>
            </button>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 border border-slate-850 rounded text-amber-500 font-mono font-bold animate-pulse">
              LIVE SEARCH SCANS
            </span>
          </div>
        </div>

        {/* Categories Sorter */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
          {([
            { id: 'ALL', label: 'All Scans' },
            { id: 'BREAKOUT', label: '🎯 Breakouts' },
            { id: 'MOMENTUM_SPIKE', label: '🔥 Momentum' },
            { id: 'DELIVERY_SPIKE', label: '📈 Delivery Spikes' },
            { id: 'SMART_MONEY', label: '🐋 Smart Money / block buy' }
          ] as const).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`py-1.5 px-3 text-[10.5px] font-bold tracking-wider uppercase rounded-lg border font-sans whitespace-nowrap transition-colors duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-slate-950 border-emerald-500/30 text-emerald-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scanned Stock list */}
        <div id="scanned-items-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredScanners.map(item => {
            const isNegative = item.changePct < 0;

            return (
              <div
                key={item.symbol}
                className="bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 shadow-sm"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2 font-sans">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">{item.symbol}</span>
                      <span className="text-[9.5px] bg-slate-900 border border-slate-800 text-slate-400 rounded px-1.5 font-sans font-bold uppercase">
                        {item.sector}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5 font-bold">{item.name}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-white block">{item.price}</span>
                    <span className={`text-[10px] font-mono font-black ${isNegative ? 'text-rose-450' : 'text-emerald-400'}`}>
                      {item.changePct > 0 ? '+' : ''}{item.changePct}%
                    </span>
                  </div>
                </div>

                {/* Cognitive Trigger Line */}
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 ">
                    <Zap className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
                    <span className="text-[10px] text-amber-400 font-mono tracking-wider font-extrabold uppercase">
                      SIGNAL: {item.signal}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans mt-0.5">
                    {item.reason}
                  </p>
                </div>

                {/* Footer Details */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-2">
                  <span>Volume: <strong className="text-slate-300">{item.volume}</strong></span>
                  <span className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-0.5 font-bold">
                    View setup <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
