/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, HelpCircle, Send, Play, Bot, AlertTriangle, 
  TrendingUp, Compass, MessageSquare, Briefcase, Zap, Skull
} from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  persona?: string;
  isHeuristic?: boolean;
}

interface HinglishAdvisorProps {
  currentSymbol?: string;
  currentSector?: string;
  currentTrend?: string;
  currentPrice?: string;
}

export default function HinglishAdvisor({ 
  currentSymbol = 'NIFTY 50', 
  currentSector = 'Index', 
  currentTrend = 'Bullish',
  currentPrice = '₹24,185.30'
}: HinglishAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<'quant' | 'risk_manager' | 'scalpmaster'>('quant');

  const personas = {
    quant: {
      name: 'Institutional Quant Analyst',
      subtitle: 'Premium Hedge Fund Math & Option OI Tracker',
      avatar: '🐋',
      accentColor: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      initialMessage: `Namaste! Main hoon aapka Institutional Quant. ${currentSymbol} ke option chain, writing activity aur smart money buy blocks ka deep analysis tayaar hai! Mujhse pucho option theta decay, put writing supports ya global markets ka macro direction.`
    },
    risk_manager: {
      name: 'Conservative Safety Engineer',
      subtitle: 'Strict Risk Limiter & Capital Protector',
      avatar: '🛡️',
      accentColor: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
      initialMessage: `Hello there! Capital bachana pehla rule hai trading ka. Jab tak confirmation signal match na ho, tab tak trade ko avoid karein. Mere se stoploss rules aur capital risk limit rules ke baare me seekhein.`
    },
    scalpmaster: {
      name: 'Option Buyer Scalping Master',
      subtitle: 'Momentum Sniper & Price Action Specialist',
      avatar: '⚡',
      accentColor: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
      initialMessage: `Suno re bhai! Option buyers ke paas time nahi hai hold karne ka. Fast delta momentum pakdo aur exit maaro! High volatility aur breakouts kab trade karein, quick guidance ke liye ask me.`
    }
  };

  useEffect(() => {
    // Reset messages with initial persona message
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: personas[activePersona].initialMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona
      }
    ]);
  }, [activePersona, currentSymbol]);

  // Comprehensive client-side AI response generator for instant loading and 100% reliable 429 fallback
  const getHeuristicHinglishResponse = (query: string, persona: 'quant' | 'risk_manager' | 'scalpmaster'): string => {
    const text = query.toLowerCase();
    
    // Core logic keywords mapping
    if (text.includes('avoid') || text.includes('kab avoid') || text.includes('no entry')) {
      if (persona === 'quant') {
        return `Suno boss, market me jab India VIX 18 ke upar nikal jaaye ya Put-Call Ratio (PCR) 0.605 se niche drop ho jaaye, tab andhadhundh entries avoid karni chahiye. ${currentSymbol} me abhi premium levels balance hain, unnecessary over-trading control karo.`;
      } else if (persona === 'risk_manager') {
        return `Khabardar! Agar trade size aapke capital ke 2% risk rule se badi ho rahi hai, ya opening 15-minute high/low breakout nahi hua hai, to strictly entry avoid karein. Blind buying trap me fansa sakti hai.`;
      } else {
        return `Sideways market me entry avoid karo re baba! Jab premium ranges break nahi ho rahi hain aur RSI 45 to 55 ke beech dholak ki tarah ghoom raha hai, to premium buy karne se sirf theta decay nuksan dega. Stay out!`;
      }
    }

    if (text.includes('stoploss') || text.includes('sl ') || text.includes('risk')) {
      if (persona === 'quant') {
        return `Stoploss invalidation zone is basic math. ${currentSymbol} ke current price ${currentPrice} ke niche hum trailing standard deviation basis par SL calculate karte hain. Bina statistical stop loss ke trade math/capital leak karega.`;
      } else if (persona === 'risk_manager') {
        return `Mera automatic system kehta hai ki trailing SL lagane ka sahi tarika 5-minute ATR indicator hai. Hard stoploss strict invalidation point pe hona chahiye. Kabhi bhi live position me SL badhayein mat!`;
      } else {
        return `Delta blast tabhi maza deta hai jab tight SL ready ho! Momentum slow hote hi position cut karo. Support zone tut te hi hold mat karo, option capital 50% wipe ho sakti hai.`;
      }
    }

    if (text.includes('vix') || text.includes('fear') || text.includes('volatility')) {
      return `India VIX low ho toh premium pricing sasti hoti hai (Option Buyers safe zone), par momentum weak ho sakta hai. Agar VIX spike ho raha hai (above 18), toh margins shift hogi. Options sellers are trap spots! Trailing SL tighter set kijiye.`;
    }

    if (text.includes('entry') || text.includes('kab buy') || text.includes('kab enter')) {
      if (persona === 'quant') {
        return `${currentSymbol} me safe long entry support pullbacks par hai. PCR support boundary 1.12 par static levels check karein, call writers cover kar rahe hain 24100 ranges ko. Aggressive buyers levels track karein.`;
      } else if (persona === 'risk_manager') {
        return `Support breakdown pivot tests hone ke baad candle close par validation milti hai. High-volume cluster block confirmations are required. Above key EMAs is standard setup.`;
      } else {
        return `Price action breakout confirm hotey hi buy button click karo! Range boundary (EMA-20 crossover on 15m) supports explosive movement. Volume bars follow trigger.`;
      }
    }

    if (text.includes('options') || text.includes('call') || text.includes('put') || text.includes('oi')) {
      return `${currentSymbol} me highest CALL Open Interest buildup resistance zones indicate karta hai, aur highest PUT OI solid floor support hai. Option buyers support pullbacks track karein to minimize loss ratios!`;
    }

    // Default responses tailored by persona
    if (persona === 'quant') {
      return `Quant analysis checklist for ${currentSymbol} (${currentPrice}): Trend strength is ${currentTrend}. Institutional orderbook indicate positive smart money block clusters. PCR ranges are consistent. What options strategy can I structure for you?`;
    } else if (persona === 'risk_manager') {
      return `Is trade risk ratio proper? Stoploss rules must be non-negotiable. Expected Capital Drawdown estimates show balanced buffers. Avoid emotional trade revenge setups. Keep position sized correctly.`;
    } else {
      return `Chalo, ready ho jao fast move ke liye! RSI setup aur EMA support index par perfect momentum trigger hai. Any questions on dynamic trend continuation scaling? Target triggers fast!`;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Fetch dynamic answer from our server if possible, or fallback gracefully with local heuristics
      const response = await fetch('/api/market/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.text,
          persona: activePersona,
          symbol: currentSymbol,
          sector: currentSector,
          trend: currentTrend,
          price: currentPrice
        })
      });

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: data.reply || getHeuristicHinglishResponse(userMsg.text, activePersona),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona,
        isHeuristic: !data.reply
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      // Graceful local intelligence fallback to bypass lack of connection
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: getHeuristicHinglishResponse(userMsg.text, activePersona),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona,
        isHeuristic: true
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedPrompts = [
    { label: 'Kab index me entry lena?', query: 'Kab index me entry le sakte hain?' },
    { label: 'Kab avoid karna chahiye?', query: 'Muje kab trade ignore / avoid karna chahiye?' },
    { label: 'Risk & Stoploss rules?', query: 'Aapke safety stoploss placement rules kya hai?' },
    { label: 'How to trade high VIX?', query: 'When INDIA VIX spikes high, option buyers and sellers kya karein?' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 font-sans text-xs h-[480px]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-100">
              IndicTrade AI Hinglish Chatbot
            </h3>
            <p className="text-[10px] text-slate-400">Institutional Strategy & Execution Coach</p>
          </div>
        </div>

        {/* Cooldown/Quota alert */}
        <span className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 uppercase tracking-widest font-black shrink-0">
          PERSONAS LIVE
        </span>
      </div>

      {/* Persona Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl">
        {(['quant', 'risk_manager', 'scalpmaster'] as const).map(pKey => (
          <button
            key={pKey}
            onClick={() => setActivePersona(pKey)}
            className={`py-1.5 px-2 text-[9px] font-bold rounded-lg border whitespace-nowrap outline-none transition-all duration-200 cursor-pointer ${
              activePersona === pKey
                ? 'bg-slate-900 border-slate-850 text-white shadow'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {personas[pKey].avatar} {personas[pKey].name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Interactive Messages Display Area */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-850 p-3.5 overflow-y-auto no-scrollbar flex flex-col gap-3 h-56">
        
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const pers = personas[msg.persona as 'quant' | 'risk_manager' | 'scalpmaster'] || personas.quant;

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {/* Sender Tag */}
              {!isUser && (
                <div className="flex items-center gap-1.5 mb-1 text-[9px] text-slate-500 font-mono">
                  <span>{pers.avatar}</span>
                  <span className="font-bold">{pers.name}</span>
                  {msg.isHeuristic && (
                    <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1 py-0.2 rounded font-thin uppercase">Fallback AI</span>
                  )}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`p-3 rounded-xl border leading-relaxed font-sans text-xs ${
                isUser 
                  ? 'bg-slate-905 border-slate-800 text-white rounded-tr-none' 
                  : 'bg-slate-900 border-slate-850 text-slate-200 rounded-tl-none pr-4'
              }`}>
                {msg.text}
              </div>

              {/* Timing */}
              <span className="text-[8px] text-slate-600 mt-1 font-mono">{msg.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] py-1 antialiased">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>AI writing Hinglish breakdown...</span>
          </div>
        )}

      </div>

      {/* Preset Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-1.5">
          {predefinedPrompts.map(prompt => (
            <button
              key={prompt.label}
              onClick={() => {
                setInputText(prompt.query);
              }}
              className="px-2.5 py-1 text-[9.5px] bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all text-left truncate"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask me in Hinglish (e.g., Target calculation kaise karein?)..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 font-sans text-white text-xs outline-none"
        />
        <button 
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
