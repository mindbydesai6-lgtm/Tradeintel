/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { TradeAlert, MarketIndex, ScannerItem } from './types';
import MarketTicker from './components/MarketTicker';
import DeepAnalysis from './components/DeepAnalysis';
import MarketScanners from './components/MarketScanners';
import RiskSimulator from './components/RiskSimulator';
import CrashWarning from './components/CrashWarning';
import WatchlistManager from './components/WatchlistManager';
import { 
  BarChart2, ShieldAlert, Layers, Compass, LineChart, PieChart,
  BookOpen, Info, ShieldCheck
} from 'lucide-react';

export default function App() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [scanners, setScanners] = useState<ScannerItem[]>([]);
  const [isLoadingIndices, setIsLoadingIndices] = useState(false);
  const [isLoadingScanners, setIsLoadingScanners] = useState(false);
  const [serverMode, setServerMode] = useState<'live' | 'demo' | 'quota_cooldown' | 'demo_fallback'>('live');
  const [activeView, setActiveView] = useState<'analysis' | 'scanners' | 'risk' | 'health'>('analysis');
  
  // Default analysis state for first load
  const [analysisData, setAnalysisData] = useState<TradeAlert & { mode?: string }>({
    stockIndex: 'NIFTY 50',
    sector: 'Index',
    currentPrice: '₹24,185.30',
    tradeType: 'Swing Trade',
    direction: 'BUY',
    trendStrength: 'Bullish',
    confidenceScore: 88,
    probability: 'High',
    entryDetails: {
      idealEntryZone: '₹24,050 - ₹24,150',
      safeEntry: 'Above breakout range price ₹24,250',
      aggressiveEntry: 'At current market price ₹24,185.30',
      bestEntryTiming: 'Post opening volatility, around 10:00 AM IST',
      confirmationSignals: ['RSI double bottom pattern on 15m candle', 'Institutional block volume matches on order tape', 'Put writing buildup at 24000 strike support boundaries'],
    },
    exitDetails: {
      target1: '₹24,350',
      target2: '₹24,500',
      target3: '₹24,750',
      finalExitZone: 'Trailing stoploss breakout alert triggered or target 3 met',
    },
    riskManagement: {
      stoploss: '₹23,900',
      trailingStoploss: '₹24,010',
      riskLevel: 'Medium',
      capitalRiskPct: '1.5% - 2% per setup',
      riskRewardRatio: '1:2.4',
    },
    profitLossEstimation: {
      estimates: [
        { capital: 10000, qty: 1, estProfit: '₹314.70', estLoss: '₹285.30' },
        { capital: 50000, qty: 2, estProfit: '₹629.40', estLoss: '₹570.60' },
        { capital: 100000, qty: 4, estProfit: '₹1,258.80', estLoss: '₹1,141.25' },
      ],
      positionSizing: 'Max 10% portfolio allocation exposure on single index positions',
      marginRequirement: 'Standard cash market margins, no leverage is suggested',
      leverageRisk: 'For derivatives (5x), risk bounds expand. Scale down quantities.',
    },
    hinghingExplanation: '', // Wait, it will map to standard hinglish below
    hinglishExplanation: 'Nifty me lower ranges par strong support build-up ho raha hai. Put writing build-up 24,000 index boundaries par absolute heavy hai, jisse immediate reversal safe lag raha hai. Intraday traders and swing target buyers support dips par enter kar sakte hain, strictly keep stoploss active.',
  });

  // Fetch index prices
  const fetchIndices = async () => {
    setIsLoadingIndices(true);
    try {
      const res = await fetch('/api/market/indices');
      const data = await res.json();
      if (data.indices) {
        setIndices(data.indices);
      }
      if (data.mode) {
        setServerMode(data.mode);
      }
    } catch (e) {
      console.error('Failed to fetch indices:', e);
    } finally {
      setIsLoadingIndices(false);
    }
  };

  // Fetch scanner findings
  const fetchScanners = async () => {
    setIsLoadingScanners(true);
    try {
      const res = await fetch('/api/market/scanners');
      const data = await res.json();
      if (data.scanners) {
        setScanners(data.scanners);
      }
      if (data.mode) {
        setServerMode(data.mode);
      }
    } catch (e) {
      console.error('Failed to fetch scanners:', e);
    } finally {
      setIsLoadingScanners(false);
    }
  };

  // Fetch deep grounded analysis on search trigger
  const fetchAnalysis = async (symbol: string): Promise<TradeAlert & { mode?: string }> => {
    const res = await fetch('/api/market/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    const parsed = await res.json();
    if (parsed.stockIndex) {
      setAnalysisData(parsed);
    }
    return parsed;
  };

  useEffect(() => {
    fetchIndices();
    fetchScanners();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all duration-300 selection:bg-emerald-500/30 selection:text-white">
      
      {/* Header Panel */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <LineChart className="w-5 h-5" />
              </span>
              <h1 id="app-title" className="text-lg font-black tracking-tight text-white font-sans uppercase">
                IndicTrade AI
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Institutional-Grade Intelligence & Technical Risk Management System for the Indian Markets.
            </p>
          </div>

          {/* Navigation layout tabs */}
          <nav className="flex items-center bg-slate-950 p-1 border border-slate-840 rounded-xl">
            {([
              { id: 'analysis', label: 'Stock Analysis', icon: <Compass className="w-3.5 h-3.5" /> },
              { id: 'scanners', label: 'Screener Scanners', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'risk', label: 'Risk Simulator', icon: <PieChart className="w-3.5 h-3.5" /> },
              { id: 'health', label: 'Market Health Index', icon: <BarChart2 className="w-3.5 h-3.5" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold rounded-lg font-sans transition-all duration-200 cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-slate-900 border border-slate-850 text-white'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
        </div>
      </header>

      {/* Dynamic Indices Tick Ribbon */}
      <MarketTicker 
        indices={indices} 
        onRefresh={fetchIndices} 
        isLoading={isLoadingIndices} 
        serverMode={serverMode} 
      />

      {/* Main dashboard body */}
      <main className="flex-1 bg-slate-950/40">
        {activeView === 'analysis' && (
          <div id="view-analysis" className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto">
            {/* Left Watchlist Panel */}
            <div className="xl:col-span-1 flex flex-col gap-6">
              <WatchlistManager onSelectSymbol={fetchAnalysis} serverMode={serverMode} />
            </div>
            
            {/* Interactive Analytical Panels & Ranges */}
            <div className="xl:col-span-3">
              <DeepAnalysis onAnalyze={fetchAnalysis} defaultData={analysisData} />
            </div>
          </div>
        )}

        {activeView === 'scanners' && (
          <div id="view-scanners">
            <MarketScanners 
              scanners={scanners} 
              isLoading={isLoadingScanners} 
              onRefreshScanners={fetchScanners} 
            />
          </div>
        )}

        {activeView === 'risk' && (
          <div id="view-risk">
            <RiskSimulator />
          </div>
        )}

        {activeView === 'health' && (
          <div id="view-health">
            <CrashWarning />
          </div>
        )}
      </main>

      {/* Footer Banner */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 px-4 text-center text-xs font-sans mt-12">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="text-slate-400">
            Market risky hai. Ye AI-assisted analysis hai, financial advice nahi. Always manage risk first.
          </p>
          <p className="text-[10px] text-slate-600">
            &copy; 2026 IndicTrade AI. Integrated using Gemini Search Grounding. All data limits and indexes cache locally.
          </p>
        </div>
      </footer>

    </div>
  );
}
