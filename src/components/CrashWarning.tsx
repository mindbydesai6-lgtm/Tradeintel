/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle, Thermometer, ShieldAlert } from 'lucide-react';

export default function CrashWarning() {
  // Interactive inputs to adjust state metrics
  const [indiaVix, setIndiaVix] = useState<number>(12.45);
  const [pcr, setPcr] = useState<number>(1.15);
  const [indexRsi, setIndexRsi] = useState<number>(61.5);

  // Derive simple health score based on market indicators
  // VIX: higher -> safer if fear, but high spike > 20 -> crash risk. VIX < 11 -> bubble complacency.
  // PCR: high > 1.4 -> bullish but oversold soon. < 0.7 -> bearish or panic setup.
  // RSI: > 75 -> bubble complacency. < 30 -> oversold.
  
  let healthScore = 50; // default medium-high
  let zoneLabel = 'Healthy MarkUp';
  let zoneColor = 'text-emerald-400';
  let bannerClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  let description = 'Market is consolidating rationally. Institutional accumulation is supportive across key heavyweights.';
  let icon = <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;

  // Formulate simple mathematical model to evaluate health zone
  const rsiDelta = indexRsi > 70 ? (indexRsi - 70) * 2.5 : indexRsi < 35 ? (35 - indexRsi) * 2 : 0;
  const vixDelta = indiaVix < 11 ? (11 - indiaVix) * 5 : indiaVix > 18 ? (indiaVix - 18) * 4 : 0;
  const pcrDelta = pcr < 0.75 ? (0.75 - pcr) * 30 : pcr > 1.35 ? (pcr - 1.35) * 20 : 0;

  const riskScore = Math.min(100, Math.max(5, (vixDelta + rsiDelta + pcrDelta + 40)));

  if (riskScore > 75) {
    zoneLabel = 'EXTREME BUBBLE / CORRECTION WARNING';
    zoneColor = 'text-rose-400';
    bannerClass = 'bg-rose-500/10 border-rose-500/20 text-rose-450';
    description = 'High risk of short-term institutional profit booking or automated stop-runs. Complacency is near historic peaks, protect capital with trail SL.';
    icon = <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
  } else if (riskScore > 55) {
    zoneLabel = 'Distributive Overheating';
    zoneColor = 'text-yellow-500';
    bannerClass = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
    description = 'Market margins are stretched. Selective momentum scanners indicate operator flow, but leading stock caps are flattening.';
    icon = <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />;
  } else if (indexRsi < 35) {
    zoneLabel = 'Underheated Accumulation';
    zoneColor = 'text-blue-400';
    bannerClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    description = 'High fear but structurally attractive demand zones are loaded. Smart money block deals are entering historical buffers.';
    icon = <Thermometer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />;
  }

  // Draw radial SVG gauge values
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* LEFT: THE DIAL RADIAL EXCLUSIVES */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-between text-center gap-4">
        <div className="flex items-center gap-2 self-start font-sans">
          <AlertTriangle className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
            Market Health & Bubble Dial
          </h3>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-44 h-44 flex items-center justify-center pt-2">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Value fill ring */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              className={`transition-all duration-300 ${riskScore > 75 ? 'stroke-rose-500' : riskScore > 55 ? 'stroke-yellow-500' : 'stroke-emerald-400'}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center font-sans">
            <span className="text-3xl font-black font-mono tracking-tight text-white">{riskScore.toFixed(0)}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Risk Index %</span>
          </div>
        </div>

        {/* Dynamic Zone Tag */}
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Computed Market Stage</p>
          <div className={`text-sm font-black uppercase ${zoneColor}`}>{zoneLabel}</div>
        </div>

      </div>

      {/* RIGHT: INTERACTIVE ADJUSTER PANEL */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans">
            Hedge Fund Parameter Matrix
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">ADJUST VALUES TO TEST SENSITIVITY</span>
        </div>

        {/* Adjuster sliders */}
        <div className="space-y-4 font-sans text-xs">
          
          {/* India VIX Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">INDIA VIX (Fear Gauge):</span>
              <span className="text-white font-bold">{indiaVix.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="8"
              max="35"
              step="0.05"
              value={indiaVix}
              onChange={e => setIndiaVix(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 font-mono">
              <span>COMPLACENCY (8.00)</span>
              <span>HISTORICAL MEAN (14.00)</span>
              <span>PANIC SPIKE (35.00)</span>
            </div>
          </div>

          {/* Put call ratio slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">Put-Call Ratio (PCR):</span>
              <span className="text-white font-bold">{pcr.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.02"
              value={pcr}
              onChange={e => setPcr(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 font-mono">
              <span>BEARISH / EXTREME WRITING (0.50)</span>
              <span>BALANCED (1.00)</span>
              <span>OVERSOLD / BULLISH REVERSAL (1.80)</span>
            </div>
          </div>

          {/* Index RSI Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400 font-sans">Index Momentum (RSI):</span>
              <span className="text-white font-bold">{indexRsi.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="0.5"
              value={indexRsi}
              onChange={e => setIndexRsi(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 font-mono">
              <span>OVERSOLD DEPTH (20.0)</span>
              <span>MEDIAN STRETCH (50.0)</span>
              <span>OVERBOUGHT COMPLACENCY (90.0)</span>
            </div>
          </div>

        </div>

        {/* Dial advisory */}
        <div className={`p-3.5 rounded-xl border flex gap-3 ${bannerClass}`}>
          {icon}
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-widest uppercase">CORRECTION INDEX REPORT</span>
            <p className="text-[11px] leading-relaxed font-sans opacity-95">
              {description} Use these ranges as systemic safeguards before committing capital blocks.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
