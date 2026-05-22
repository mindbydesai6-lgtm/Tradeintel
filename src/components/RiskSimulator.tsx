/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertTriangle, Play, HelpCircle, AlertCircle } from 'lucide-react';

export default function RiskSimulator() {
  // Simulator states
  const [capital, setCapital] = useState<number>(50000);
  const [entryPrice, setEntryPrice] = useState<number>(1500);
  const [stoploss, setStoploss] = useState<number>(1465);
  const [target, setTarget] = useState<number>(1580);
  const [riskPercent, setRiskPercent] = useState<number>(1.5); // 1.5% max risk
  const [leverage, setLeverage] = useState<number>(1); // Defaults to standard equity delivery

  // Heatmap sector state representing live ticking sector percentages
  const [heatmap, setHeatmap] = useState<Array<{ name: string; symbol: string; change: number; state: 'up' | 'down' | 'neutral' }>>([
    { name: 'Defence PSU', symbol: 'HAL', change: 4.8, state: 'neutral' },
    { name: 'Railway PSU', symbol: 'RVNL', change: 8.2, state: 'neutral' },
    { name: 'Fintech Banking', symbol: 'HDFC BANK', change: 1.15, state: 'neutral' },
    { name: 'IT Infrastructure', symbol: 'INFOSYS', change: 3.12, state: 'neutral' },
    { name: 'Renewable Power', symbol: 'IREDA', change: -1.45, state: 'neutral' },
    { name: 'EV Sector', symbol: 'TATA MOTORS', symbol_alias: 'TAMOT', change: 2.34, state: 'neutral' },
    { name: 'Heavy Metals', symbol: 'TATA STEEL', change: 4.55, state: 'neutral' },
    { name: 'Oil & Energy', symbol: 'RELIANCE', change: 1.25, state: 'neutral' },
    { name: 'Agri FMCG', symbol: 'ITC', change: -0.45, state: 'neutral' },
  ]);

  // Handle heatmap fluctuation tick simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeatmap(prev => 
        prev.map(item => {
          if (Math.random() > 0.6) {
            const up = Math.random() > 0.45;
            const fluctuation = (Math.random() * 0.15) * (up ? 1 : -1);
            return {
              ...item,
              change: parseFloat((item.change + fluctuation).toFixed(2)),
              state: up ? 'up' : 'down',
            };
          }
          return { ...item, state: 'neutral' };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Calculate position sizing metrics
  const diffPerShare = Math.abs(entryPrice - stoploss);
  const totalAmountToRisk = capital * (riskPercent / 100);
  
  // Qty allowed based on risk limit or total buying power
  const maxQtyAllowedByRisk = diffPerShare > 0 ? Math.floor(totalAmountToRisk / diffPerShare) : 0;
  
  // Total margin requirement with leverage
  const buyingPower = capital * leverage;
  const maxQtyAllowedByCapital = entryPrice > 0 ? Math.floor(buyingPower / entryPrice) : 0;

  // Ultimate safe trade quantity recommended by system
  const suggestedQty = Math.min(maxQtyAllowedByRisk, maxQtyAllowedByCapital) || 1;
  const committedCapital = suggestedQty * entryPrice;
  const marginRequired = committedCapital / leverage;

  const R_To_R = diffPerShare > 0 ? (Math.abs(target - entryPrice) / diffPerShare).toFixed(1) : '0';
  const potentialLoss = suggestedQty * diffPerShare;
  const potentialProfit = suggestedQty * Math.abs(target - entryPrice);

  const leverageRiskLevel = leverage > 5 ? 'High Risk' : leverage > 3 ? 'Medium Risk' : 'Low Risk';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* POSITION SIZER CALCULATOR AND CAPITAL ADVISORY: 7 COLS */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-sans">
            Interactive Position-Sizing Simulator
          </h3>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-sans text-xs">
          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase">Account Capital (INR)</label>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(Math.max(100, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase">Entry boundary (₹)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase">Protective Stoploss (₹)</label>
            <input
              type="number"
              value={stoploss}
              onChange={e => setStoploss(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase">Profit Target (₹)</label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(Math.max(0.1, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold uppercase">Trade Risk limit %</label>
            <select
              value={riskPercent}
              onChange={e => setRiskPercent(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white"
            >
              <option value="0.5">0.5% (Extremely Conservative)</option>
              <option value="1.0">1.0% (Standard Hedge Fund)</option>
              <option value="1.5">1.5% (Balanced Aggressive)</option>
              <option value="2.0">2.0% (Professional Cap Limit)</option>
              <option value="3.0">3.0% (High Speculation)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 font-bold">LEVERAGE (MARGIN multiplier)</label>
            <select
              value={leverage}
              onChange={e => setLeverage(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-lg p-2 font-mono text-white"
            >
              <option value="1">1x (Standard Delivery Cash)</option>
              <option value="2">2x (Derivatives Option Hedging)</option>
              <option value="3">3x (Futures Standard)</option>
              <option value="5">5x (Intraday Equity Margining)</option>
              <option value="10">10x (Extreme Leverage Risk)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Position Output */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 space-y-3.5">
          <span className="text-[10px] text-slate-500 font-mono tracking-wider font-extrabold uppercase">
            CALCULATED RISK MATRIX OUTCOMES
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-sans">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-500">SUGGESTED QTY</span>
              <div id="sim-qty" className="text-lg font-bold text-white font-mono mt-0.5">{suggestedQty}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-500">R:R TARGET SCORE</span>
              <div id="sim-rr" className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{R_To_R}:1</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-500">MARGIN REQUIRED (₹)</span>
              <div id="sim-margin" className="text-lg font-bold text-white font-mono mt-0.5">{marginRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-[9px] text-slate-500">LEVERAGE RISK LEVEL</span>
              <div className={`text-sm font-black font-sans mt-1.5 uppercase ${leverage > 5 ? 'text-rose-450' : leverage > 2 ? 'text-yellow-500' : 'text-emerald-400'}`}>
                {leverageRiskLevel}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-900" />

          {/* Capital Risk vs potential profits */}
          <div className="flex justify-between text-xs font-sans">
            <div className="space-y-0.5">
              <span className="text-slate-500">Max Projected Capital Drawdown:</span>
              <div id="sim-est-loss" className="text-sm font-semibold text-rose-450 font-mono">₹{potentialLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-slate-500">Estimated Target Profit:</span>
              <div id="sim-est-profit" className="text-sm font-semibold text-emerald-400 font-mono">₹{potentialProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Smart Money Capital Protection Advice */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <span className="text-[10px] text-amber-400 font-black tracking-widest uppercase">
              Capital Protection Advisory
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Suggested allocation committing <strong className="text-slate-300">₹{committedCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> from account size. 
              {leverage > 1 ? ` Leverage sets account risk multiplier at ${leverage}x. Adjust trailing stoploss tight at standard ATR lines, especially when in indices.` : ' Operating on delivery cash buffers protects you from intra-day forced square-offs.'} Never compromise on original invalidation rules.
            </p>
          </div>
        </div>

      </div>

      {/* SECTOR ALLOCATIONS HEATMAP MATRIX: 5 COLS */}
      <div className="lg:col-span-12 xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 font-sans">
              Sector Strength & Operator Heatmap Matrix
            </h3>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Heatmap Grid */}
        <div id="heatmap-sector-grid" className="grid grid-cols-3 gap-3">
          {heatmap.map(item => {
            const isNegative = item.change < 0;
            const bgClass = isNegative
              ? 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/30'
              : 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-900/30';

            const borderFlash = item.state === 'up'
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 scale-102'
              : item.state === 'down'
                ? 'border-rose-500 shadow-lg shadow-rose-500/10 scale-102'
                : 'border-slate-800/80';

            return (
              <div
                key={item.symbol}
                className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-300 ${bgClass} ${borderFlash} cursor-pointer min-h-[90px]`}
              >
                <div>
                  <span className="text-[10px] font-mono font-black text-slate-300 block">{item.symbol}</span>
                  <span className="text-[9px] text-slate-500 font-sans block mt-0.5 truncate">{item.name}</span>
                </div>

                <div className={`text-[12px] font-mono font-black text-right block mt-2 ${isNegative ? 'text-rose-450' : 'text-emerald-400'}`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Nodes flash brighter when operators block order ticks occur on orderbook tapes.</span>
        </div>

      </div>

    </div>
  );
}
