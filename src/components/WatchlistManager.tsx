/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Bell, AlertCircle, Play, Sparkles, TrendingUp,
  Flame, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  alertPrice?: number;
  alertTriggered?: boolean;
}

interface WatchlistManagerProps {
  onSelectSymbol: (symbol: string) => void;
  serverMode: string;
}

export default function WatchlistManager({ onSelectSymbol, serverMode }: WatchlistManagerProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2482.40, change: 1.25 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1612.15, change: 0.85 },
    { symbol: 'HAL', name: 'Hindustan Aeronautics', price: 4210.50, change: 4.88 },
    { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', price: 382.45, change: 8.24 },
    { symbol: 'IREDA', name: 'Indian Renewable Energy', price: 185.30, change: -1.45 },
  ]);

  const [newSymbol, setNewSymbol] = useState('');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [selectedForAlert, setSelectedForAlert] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<'custom' | 'ai' | 'momentum' | 'breakout'>('custom');
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: 'alert' | 'info' }>>([]);

  // Mock ticking prices for watchlist stocks
  useEffect(() => {
    const timer = setInterval(() => {
      setWatchlist(prev => 
        prev.map(item => {
          if (Math.random() > 0.4) {
            const isChangeUp = Math.random() > 0.48;
            const delta = parseFloat((item.price * (Math.random() * 0.002) * (isChangeUp ? 1 : -1)).toFixed(2));
            const freshPrice = parseFloat((item.price + delta).toFixed(2));
            const freshChange = parseFloat((item.change + (isChangeUp ? 0.05 : -0.05)).toFixed(2));
            
            let triggered = item.alertTriggered;
            if (item.alertPrice && !item.alertTriggered) {
              const prevPrice = item.price;
              const hitAbove = prevPrice <= item.alertPrice && freshPrice >= item.alertPrice;
              const hitBelow = prevPrice >= item.alertPrice && freshPrice <= item.alertPrice;
              if (hitAbove || hitBelow) {
                triggered = true;
                setNotifications(prevNotifs => [
                  {
                    id: Date.now(),
                    message: `🔔 PRICE ALERT TRIGGERED: ${item.symbol} reached ₹${freshPrice} (Target: ₹${item.alertPrice})`,
                    type: 'alert'
                  },
                  ...prevNotifs
                ]);
              }
            }

            return {
              ...item,
              price: freshPrice,
              change: freshChange,
              alertTriggered: triggered
            };
          }
          return item;
        })
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    const itemSymbol = newSymbol.trim().toUpperCase();
    
    // Check if duplicate
    if (watchlist.some(it => it.symbol === itemSymbol)) return;

    const basePrice = Math.floor(Math.random() * 3000) + 100;
    const newItem: WatchlistItem = {
      symbol: itemSymbol,
      name: `${itemSymbol} Industrial Capital`,
      price: basePrice,
      change: parseFloat((Math.random() * 3 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2))
    };

    setWatchlist(prev => [...prev, newItem]);
    setNewSymbol('');
    setNotifications(prev => [
      { id: Date.now(), message: `➕ Added ${itemSymbol} to active watch scanners.`, type: 'info' },
      ...prev
    ]);
  };

  const handleRemoveSymbol = (sym: string) => {
    setWatchlist(prev => prev.filter(it => it.symbol !== sym));
    if (selectedForAlert === sym) setSelectedForAlert(null);
  };

  const handleSetAlert = (sym: string) => {
    const doublePrice = parseFloat(newAlertPrice);
    if (isNaN(doublePrice) || doublePrice <= 0) return;

    setWatchlist(prev => 
      prev.map(it => 
        it.symbol === sym 
          ? { ...it, alertPrice: doublePrice, alertTriggered: false } 
          : it
      )
    );
    setSelectedForAlert(null);
    setNewAlertPrice('');
    setNotifications(prev => [
      { id: Date.now(), message: `🎯 Alert point active for ${sym} at ₹${doublePrice}`, type: 'info' },
      ...prev
    ]);
  };

  const loadPreset = (preset: 'ai' | 'momentum' | 'breakout') => {
    setActivePreset(preset);
    let items: WatchlistItem[] = [];
    if (preset === 'ai') {
      items = [
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3845.20, change: 1.15 },
        { symbol: 'INFY', name: 'Infosys Ltd', price: 1450.40, change: -1.82 },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1612.00, change: 0.90 },
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2482.00, change: 1.30 },
      ];
    } else if (preset === 'momentum') {
      items = [
        { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', price: 382.45, change: 8.24 },
        { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4210.50, change: 4.88 },
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 168.90, change: 3.42 },
      ];
    } else if (preset === 'breakout') {
      items = [
        { symbol: 'IREDA', name: 'Indian Renewable Energy', price: 185.30, change: -1.45 },
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 942.15, change: 2.14 },
        { symbol: 'ITC', name: 'ITC Ltd FMCG', price: 428.10, change: -0.35 },
      ];
    }
    setWatchlist(items);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 font-sans text-xs">
      
      {/* Target Alerts Stream */}
      {notifications.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar border-b border-slate-800 pb-3">
          {notifications.slice(0, 3).map(notif => (
            <div 
              key={notif.id} 
              className={`p-2 rounded-lg border flex gap-2 items-start ${
                notif.type === 'alert' 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-350 animate-bounce' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div className="text-[10.5px] leading-snug font-medium">{notif.message}</div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} 
                className="ml-auto text-[9px] text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
            Micro Watchlist Tracker
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">STOCKS TICK LIVE</span>
      </div>

      {/* Preset Pickers */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => { setActivePreset('custom'); }}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border whitespace-nowrap transition-all duration-200 ${
            activePreset === 'custom' 
              ? 'bg-slate-950 border-emerald-500/30 text-emerald-400' 
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          My Watchlist
        </button>
        <button
          onClick={() => loadPreset('ai')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
            activePreset === 'ai' 
              ? 'bg-slate-950 border-emerald-500/30 text-emerald-400' 
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Recommendations</span>
        </button>
        <button
          onClick={() => loadPreset('momentum')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border whitespace-nowrap transition-all duration-200 ${
            activePreset === 'momentum' 
              ? 'bg-slate-950 border-emerald-500/30 text-emerald-400' 
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          🔥 Momentum Heavy
        </button>
        <button
          onClick={() => loadPreset('breakout')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border whitespace-nowrap transition-all duration-200 ${
            activePreset === 'breakout' 
              ? 'bg-slate-950 border-emerald-500/30 text-emerald-400' 
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          📈 Breakouts Filter
        </button>
      </div>

      {/* Quick Add Custom Symbol form */}
      {activePreset === 'custom' && (
        <form onSubmit={handleAddSymbol} className="flex gap-2">
          <input
            type="text"
            placeholder="Type Ticker (e.g., TCS)..."
            value={newSymbol}
            onChange={e => setNewSymbol(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-emerald-500/50"
          />
          <button 
            type="submit"
            className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400 p-2.5 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Watchlist Grid */}
      <div className="space-y-2">
        {watchlist.map(item => {
          const isDown = item.change < 0;
          return (
            <div key={item.symbol} className="bg-slate-950/80 border border-slate-850 hover:border-slate-700 p-3 rounded-xl transition-all duration-200 relative group">
              <div className="flex items-center justify-between">
                
                {/* Symbol & Name */}
                <div 
                  onClick={() => onSelectSymbol(item.symbol)} 
                  className="cursor-pointer space-y-0.5 flex-1 select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-white hover:text-emerald-400 transition-colors text-sm">{item.symbol}</span>
                    <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[9.5px] font-mono ${isDown ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Configuration Action Keys */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setSelectedForAlert(selectedForAlert === item.symbol ? null : item.symbol)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      item.alertPrice 
                        ? item.alertTriggered 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-450 animate-pulse'
                          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
                    }`}
                    title={item.alertPrice ? `Alert set at ₹${item.alertPrice}` : 'Set alert'}
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>

                  {activePreset === 'custom' && (
                    <button 
                      onClick={() => handleRemoveSymbol(item.symbol)}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-900/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Remove from watch list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Toggle alert entry */}
              {selectedForAlert === item.symbol && (
                <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input
                      type="number"
                      placeholder="Trigger Price"
                      value={newAlertPrice}
                      onChange={e => setNewAlertPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg p-1.5 pl-5 font-mono text-white text-[11px] outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => handleSetAlert(item.symbol)}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg px-3 py-1.5 text-[10px] transition-colors"
                  >
                    Set Alert Point
                  </button>
                </div>
              )}

              {/* Alert Active Badge */}
              {item.alertPrice && !item.alertTriggered && (
                <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded w-max">
                  <CheckCircle2 className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Alert active at ₹{item.alertPrice}</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-sans border-t border-slate-800/60 pt-2 shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
        <span>Tap any ticker to trigger institutional-grade technical scans automatically.</span>
      </div>

    </div>
  );
}
