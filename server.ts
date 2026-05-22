/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client and rate-limit cooldown tracker
let aiInstance: GoogleGenAI | null = null;
let aiCooldownUntil = 0;
let isQuotaPermanentlyExhausted = false;

function getAIClient() {
  if (isQuotaPermanentlyExhausted) {
    return null;
  }
  if (Date.now() < aiCooldownUntil) {
    console.warn(`[IndicTrade AI] Under Gemini API cooldown. Skipping API request to avoid rate limiting.`);
    return null;
  }
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      console.warn('GEMINI_API_KEY environment variable is not defined or is placeholder.');
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// In-memory cache for market indices and analysis to prevent rate limits
const cache: Record<string, { data: any; expiry: number }> = {};

function getCachedData(key: string): any | null {
  const cached = cache[key];
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any, ttlMs: number) {
  cache[key] = {
    data,
    expiry: Date.now() + ttlMs,
  };
}

// API: Health probe
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
  });
});

// API: Get major indices and macro data (using Search Grounding for live data when possible)
app.get('/api/market/indices', async (req, res) => {
  const cacheKey = 'market_indices';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const defaultIndices = [
    { symbol: '^NSEI', name: 'NIFTY 50', price: '24,185.30', change: '+142.20', changePct: 0.59, isGlobal: false },
    { symbol: '^NSEBANK', name: 'BANKNIFTY', price: '51,462.80', change: '+380.10', changePct: 0.74, isGlobal: false },
    { symbol: '^BSESN', name: 'SENSEX', price: '79,530.40', change: '+412.50', changePct: 0.52, isGlobal: false },
    { symbol: 'GIFTNIFTY', name: 'GIFT NIFTY', price: '24,245.50', change: '+175.00', changePct: 0.73, isGlobal: true },
    { symbol: 'INDIAVIX', name: 'INDIA VIX', price: '12.45', change: '-0.38', changePct: -2.96, isGlobal: false },
    { symbol: 'DXY', name: 'DOLLAR INDEX', price: '104.12', change: '+0.15', changePct: 0.14, isGlobal: true },
    { symbol: 'US_FUTURES', name: 'SPX FUTURES', price: '5,188.40', change: '+18.20', changePct: 0.35, isGlobal: true },
    { symbol: 'CRUDE_OIL', name: 'BRENT CRUDE', price: '$82.40', change: '-0.95', changePct: -1.14, isGlobal: true },
  ];

  const ai = getAIClient();
  const isCooldown = Date.now() < aiCooldownUntil;
  if (!ai) {
    // If under cooldown or no API key, return offline but highly dynamic indicators
    const jitteredIndices = defaultIndices.map(idx => {
      const isUp = Math.random() > 0.4;
      const pct = (Math.random() * 0.4) * (isUp ? 1 : -1);
      const absPrice = parseFloat(idx.price.replace(/,/g, '').replace('$', ''));
      const newPrice = (absPrice * (1 + pct / 100)).toFixed(2);
      const diff = (parseFloat(newPrice) - absPrice).toFixed(2);
      return {
        ...idx,
        price: idx.symbol === 'CRUDE_OIL' ? `$${newPrice}` : parseFloat(newPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        change: idx.symbol === 'CRUDE_OIL' 
          ? (diff.startsWith('-') ? diff : `+${diff}`)
          : (parseFloat(diff) >= 0 ? `+${parseFloat(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : parseFloat(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })),
        changePct: parseFloat(pct.toFixed(2)),
      };
    });
    const mode = isCooldown ? 'quota_cooldown' : 'demo';
    setCachedData(cacheKey, { indices: jitteredIndices, mode }, 15000);
    return res.json({ indices: jitteredIndices, mode });
  }

  try {
    const prompt = `Give me the current today's live price and percentage change for NIFTY 50 index, BANKNIFTY index, SENSEX, GIFT NIFTY, INDIA VIX, Dollar Index (DXY), SPX Futures, and Brent Crude oil. Return a clean JSON array structure under a 'indices' key. Maintain the properties: name, price, change, changePct, isGlobal. Real data is critical, use Google Search Grounding. No formatting other than pure JSON.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            indices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  change: { type: Type.STRING },
                  changePct: { type: Type.NUMBER },
                  isGlobal: { type: Type.BOOLEAN },
                },
                required: ['name', 'price', 'change', 'changePct', 'isGlobal'],
              },
            },
          },
          required: ['indices'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.indices && parsed.indices.length > 0) {
      setCachedData(cacheKey, { indices: parsed.indices, mode: 'live' }, 120000); // 2 min cache
      return res.json({ indices: parsed.indices, mode: 'live' });
    }
  } catch (error) {
    const errStr = String(error);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      isQuotaPermanentlyExhausted = true;
      aiCooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours cooldown
      console.warn(`[IndicTrade AI] Quota limit triggered on /indices API. Entering permanent simulation fallback mode.`);
      return res.json({ indices: defaultIndices, mode: 'quota_cooldown' });
    }
    console.error('Error fetching indices with search grounding:', error);
  }

  return res.json({ indices: defaultIndices, mode: 'demo_fallback' });
});

// API: Analyze specific stock/index
app.post('/api/market/analyze', async (req, res) => {
  const { symbol = 'NIFTY 50' } = req.body;
  const cacheKey = `analysis_${symbol.toUpperCase()}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const ai = getAIClient();
  const isCooldown = Date.now() < aiCooldownUntil;
  if (!ai) {
    // Generate high quality mock institutional trade setup based on common Indian stock profiles
    const mockData = generateMockAnalysis(symbol);
    const mode = isCooldown ? 'quota_cooldown' : 'demo';
    setCachedData(cacheKey, { ...mockData, mode }, 30000);
    return res.json({ ...mockData, mode });
  }

  try {
    const prompt = `Perform a highly sophisticated, institutional-grade trading and intelligence analysis for "${symbol}" in the Indian/Global financial market.
    Use Google Search Grounding to obtain the latest price, actual PE, financial metrics, derivatives data (PCR, major Call/Put open interest zones), global sentiment, and news impact.
    
    Structure the output strictly according to the following JSON schema. Include a comprehensive trade alert card, multi-layer analysis, and a friendly detailed explanation of the trade setup in simple "Hinglish" (e.g., "Yaha strong bullish momentum dikh raha hai...").
    
    Calculate realistic entry zones, 3 profit targets, stoploss, and profit/loss estimates for a trading capital of 10,000 INR, 50,000 INR, and 100,000 INR with position sizing and appropriate quantities.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stockIndex: { type: Type.STRING, description: "Name/symbol of the stock/index" },
            sector: { type: Type.STRING, description: "Market sector like Banking, IT, Pharma, Defence, PSU" },
            currentPrice: { type: Type.STRING, description: "Current actual or pre-market live price" },
            tradeType: { type: Type.STRING, description: "Intraday / Swing / Scalping / Positional" },
            direction: { type: Type.STRING, enum: ['BUY', 'SELL'] },
            trendStrength: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Sideways'] },
            confidenceScore: { type: Type.INTEGER, description: "Confidence of the trade from 0 to 100" },
            probability: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            entryDetails: {
              type: Type.OBJECT,
              properties: {
                idealEntryZone: { type: Type.STRING },
                safeEntry: { type: Type.STRING },
                aggressiveEntry: { type: Type.STRING },
                bestEntryTiming: { type: Type.STRING },
                confirmationSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['idealEntryZone', 'safeEntry', 'aggressiveEntry', 'bestEntryTiming', 'confirmationSignals'],
            },
            exitDetails: {
              type: Type.OBJECT,
              properties: {
                target1: { type: Type.STRING },
                target2: { type: Type.STRING },
                target3: { type: Type.STRING },
                finalExitZone: { type: Type.STRING },
              },
              required: ['target1', 'target2', 'target3', 'finalExitZone'],
            },
            riskManagement: {
              type: Type.OBJECT,
              properties: {
                stoploss: { type: Type.STRING },
                trailingStoploss: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Extreme'] },
                capitalRiskPct: { type: Type.STRING },
                riskRewardRatio: { type: Type.STRING },
              },
              required: ['stoploss', 'trailingStoploss', 'riskLevel', 'capitalRiskPct', 'riskRewardRatio'],
            },
            profitLossEstimation: {
              type: Type.OBJECT,
              properties: {
                estimates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      capital: { type: Type.INTEGER },
                      qty: { type: Type.INTEGER },
                      estProfit: { type: Type.STRING },
                      estLoss: { type: Type.STRING },
                    },
                  },
                },
                positionSizing: { type: Type.STRING },
                marginRequirement: { type: Type.STRING },
                leverageRisk: { type: Type.STRING },
              },
              required: ['estimates', 'positionSizing', 'marginRequirement', 'leverageRisk'],
            },
            multiLayerAnalysis: {
              type: Type.OBJECT,
              properties: {
                technical: {
                  type: Type.OBJECT,
                  properties: {
                    priceAction: { type: Type.STRING },
                    structure: { type: Type.STRING },
                    liquidityZones: { type: Type.ARRAY, items: { type: Type.STRING } },
                    indicators: { type: Type.OBJECT, description: "Key values like RSI, MACD, EMA" },
                  },
                  required: ['priceAction', 'structure', 'liquidityZones', 'indicators'],
                },
                fundamental: {
                  type: Type.OBJECT,
                  properties: {
                    valuation: { type: Type.STRING },
                    growth: { type: Type.STRING },
                    metrics: { type: Type.OBJECT, description: "Metrics such as PE, profit growth %" },
                  },
                  required: ['valuation', 'growth', 'metrics'],
                },
                derivatives: {
                  type: Type.OBJECT,
                  properties: {
                    oiBuildUp: { type: Type.STRING },
                    callPutWriting: { type: Type.STRING },
                    pcr: { type: Type.NUMBER },
                    ivAnalysis: { type: Type.STRING },
                  },
                  required: ['oiBuildUp', 'callPutWriting', 'pcr', 'ivAnalysis'],
                },
                sentiment: {
                  type: Type.OBJECT,
                  properties: {
                    newsSentiment: { type: Type.STRING },
                    retailVsInstitutional: { type: Type.STRING },
                    fearGreed: { type: Type.STRING },
                  },
                  required: ['newsSentiment', 'retailVsInstitutional', 'fearGreed'],
                },
                macro: {
                  type: Type.OBJECT,
                  properties: {
                    rbiFedRates: { type: Type.STRING },
                    inflationGdp: { type: Type.STRING },
                    globalCatalysts: { type: Type.STRING },
                  },
                  required: ['rbiFedRates', 'inflationGdp', 'globalCatalysts'],
                },
              },
              required: ['technical', 'fundamental', 'derivatives', 'sentiment', 'macro'],
            },
            hinglishExplanation: { type: Type.STRING, description: "Instantly clear, speech-style layout analytical guidance in real Hinglish." },
          },
          required: [
            'stockIndex', 'sector', 'currentPrice', 'tradeType', 'direction',
            'trendStrength', 'confidenceScore', 'probability', 'entryDetails',
            'exitDetails', 'riskManagement', 'profitLossEstimation', 'multiLayerAnalysis',
            'hinglishExplanation'
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    setCachedData(cacheKey, { ...parsed, mode: 'live' }, 300000); // 5 min cache
    return res.json({ ...parsed, mode: 'live' });
  } catch (error) {
    const errStr = String(error);
    const fallback = generateMockAnalysis(symbol);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      isQuotaPermanentlyExhausted = true;
      aiCooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours cooldown
      console.warn(`[IndicTrade AI] Quota limit triggered on /analyze API. Entering permanent simulation fallback mode.`);
      return res.json({ ...fallback, mode: 'quota_cooldown', error: String(error) });
    }
    console.error('Gemini Search grounded analysis error:', error);
    // Return high quality dummy analysis as a fallback to keep application usable
    return res.json({ ...fallback, mode: 'demo_fallback', error: String(error) });
  }
});

// API: Hinglish Advisor Chatbot Grounding Route
app.post('/api/market/chat', async (req, res) => {
  const { query, persona, symbol, sector, trend, price } = req.body;
  const ai = getAIClient();
  
  if (!ai) {
    return res.json({ reply: null, mode: 'demo' });
  }

  try {
    const roleDescription = persona === 'scalpmaster' 
      ? 'rapid momentum option buyer scalping specialist who advises on immediate delta surges'
      : persona === 'risk_manager'
        ? 'highly conservative capital safety architect focusing on hard stoploss invalidations and trailing ATR ranges'
        : 'elite hedge fund option quant analyzing open interest buildup, Call/Put write limit zones, and PCR metrics';

    const systemPrompt = `You are a professional Indian Stock Market advisor speaking in high-energy, helpful Hinglish (English-Hindi mix used in regular Mumbai/Delhi trading tables).
    Your specific persona role is a: ${roleDescription}.
    
    Current market context:
    - Target: ${symbol} (${sector})
    - Current Price: ${price}
    - Trend state: ${trend}
    
    Respond directly to the user's query in energetic, clear Hinglish. Keep your answer practical, professional, realistic, and between 90 to 120 words. Absolutely avoid system code, fake warnings, or generic greeting loops.
    
    User Query: ${query}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const reply = response.text || '';
    if (reply.trim().length > 0) {
      return res.json({ reply, mode: 'live' });
    }
  } catch (error) {
    const errStr = String(error);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      isQuotaPermanentlyExhausted = true;
      aiCooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours cooldown
      console.warn(`[IndicTrade AI] Quota limit triggered on /chat API. Entering permanent simulation fallback mode.`);
      return res.json({ reply: null, mode: 'quota_cooldown' });
    }
    console.error('Error generating Hinglish chat reply:', error);
  }

  return res.json({ reply: null, mode: 'demo_fallback' });
});

// API: Get scanner options (Momentum, Breakout, Operator activity, FII flow)
app.get('/api/market/scanners', async (req, res) => {
  const cacheKey = 'market_scanners';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const ai = getAIClient();
  const isCooldown = Date.now() < aiCooldownUntil;
  if (!ai) {
    const mockScanners = generateMockScanners();
    const mode = isCooldown ? 'quota_cooldown' : 'demo';
    setCachedData(cacheKey, { scanners: mockScanners, mode }, 30000);
    return res.json({ scanners: mockScanners, mode });
  }

  try {
    const prompt = `Using Google Search Grounding, find today's active breakout stocks, delivery spike stocks, momentum gainers, and prominent smart money/insider activity in the Indian Stock market (NSE/BSE).
    Return a clean JSON structure under a 'scanners' key containing items for Momentum, Breakout, DeliverySpike, and SmartMoney. Ensure you map: symbol, name, sector, price, changePct, signal (e.g. BREAKOUT, VOLUME_SPIKE, INSTITUTIONAL_BUY), reason, volume.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scanners: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  name: { type: Type.STRING },
                  sector: { type: Type.STRING },
                  price: { type: Type.STRING },
                  changePct: { type: Type.NUMBER },
                  signal: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  volume: { type: Type.STRING },
                },
                required: ['symbol', 'name', 'sector', 'price', 'changePct', 'signal', 'reason', 'volume'],
              },
            },
          },
          required: ['scanners'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.scanners && parsed.scanners.length > 0) {
      setCachedData(cacheKey, { scanners: parsed.scanners, mode: 'live' }, 300000);
      return res.json({ scanners: parsed.scanners, mode: 'live' });
    }
  } catch (err) {
    const errStr = String(err);
    if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      isQuotaPermanentlyExhausted = true;
      aiCooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours cooldown
      console.warn(`[IndicTrade AI] Quota limit triggered on /scanners API. Entering permanent simulation fallback mode.`);
      const fallbackScanners = generateMockScanners();
      return res.json({ scanners: fallbackScanners, mode: 'quota_cooldown' });
    }
    console.error('Error generating scanners:', err);
  }

  const fallbackScanners = generateMockScanners();
  return res.json({ scanners: fallbackScanners, mode: 'demo_fallback' });
});

// Helper: Formulate high-fidelity mock analysts models for Indian Market
function generateMockAnalysis(symbol: string) {
  const sym = symbol.toUpperCase();
  let currentPrice = '₹1,540.20';
  let sector = 'Banking & Services';
  let mockPE = '18.4';
  let direction: 'BUY' | 'SELL' = 'BUY';
  let trendStrength: 'Bullish' | 'Bearish' | 'Sideways' = 'Bullish';
  let hinglishExplanation = '';

  if (sym.includes('NIFTY') || sym.includes('NSE')) {
    currentPrice = '₹24,185.30';
    sector = 'Index';
    mockPE = '21.1';
    direction = 'BUY';
    trendStrength = 'Bullish';
    hinglishExplanation = 'Market me lower levels se dynamic support dekhne mila hai. GIFT Nifty upar trade ho raha hai aur FII activity solid consolidation points reflect kar rahi hai. PCR trigger 1.15 par standard reversal zones construct kar raha hai, momentum is positive.';
  } else if (sym.includes('RELIANCE')) {
    currentPrice = '₹2,510.45';
    sector = 'Energy & Conglomerate';
    mockPE = '25.8';
    direction = 'BUY';
    trendStrength = 'Bullish';
    hinglishExplanation = 'Reliance me Double Bottom pattern complete hua hai daily frame par. Operator volume and delivery delivery spike 48% cross kar chuki hai. RBI ki steady policies se financial structural liquidity boost hogi. Ideal long zone ready hai.';
  } else if (sym.includes('HDFC')) {
    currentPrice = '₹1,645.00';
    sector = 'Banking & FinTech';
    mockPE = '17.2';
    direction = 'BUY';
    trendStrength = 'Bullish';
    hinglishExplanation = 'HDFC Bank me smart money cluster active hai near ₹1,630-₹1,640 zone. Derivatives data me massive call writing unwind hui hai ₹1,650 levels par. Safe traders confirmation ke liye gap up break ka wait kar sakte hain.';
  } else if (sym.includes('SENSEX')) {
    currentPrice = '₹79,530.40';
    sector = 'Index';
    mockPE = '23.4';
    direction = 'BUY';
    trendStrength = 'Bullish';
    hinglishExplanation = 'Global catalysts pure strength me support kar rahe hain. US futures uptrend me block orders execute kar rhe hain. Sensex high breakout zone construct kar rha hai, leading PSUs me support continuous lines create kar rha hai.';
  } else {
    direction = Math.random() > 0.3 ? 'BUY' : 'SELL';
    trendStrength = direction === 'BUY' ? 'Bullish' : 'Bearish';
    hinglishExplanation = `${sym} ke technical frames validation signals dikha rahe hain. Volumes support zones par build up ho rahi hain. Smart activity continuous delivery patterns establish kr rhi hai. Stoploss strictly follow krein.`;
  }

  const basePrice = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
  const changeValue = (basePrice * 0.012).toFixed(2);
  const target1 = (basePrice * (direction === 'BUY' ? 1.025 : 0.975)).toFixed(2);
  const target2 = (basePrice * (direction === 'BUY' ? 1.05 : 0.95)).toFixed(2);
  const target3 = (basePrice * (direction === 'BUY' ? 1.085 : 0.915)).toFixed(2);
  const stoploss = (basePrice * (direction === 'BUY' ? 0.985 : 1.015)).toFixed(2);
  const trailingStoploss = (basePrice * (direction === 'BUY' ? 0.992 : 1.008)).toFixed(2);

  return {
    stockIndex: symbol,
    sector: sector,
    currentPrice: currentPrice,
    tradeType: 'Swing Trade',
    direction: direction,
    trendStrength: trendStrength,
    confidenceScore: 88,
    probability: 'High',
    entryDetails: {
      idealEntryZone: `₹${(basePrice * 0.995).toFixed(2)} - ₹${(basePrice * 1.002).toFixed(2)}`,
      safeEntry: `Above breakout confirmation high ₹${(basePrice * 1.008).toFixed(2)}`,
      aggressiveEntry: `At current market price ₹${currentPrice}`,
      bestEntryTiming: 'Post pre-market settlement, preferably around 09:45 AM IST',
      confirmationSignals: ['RSI double bottom entry trigger on 15m candle', 'FII block orders matching on order tape volume profile', 'Put writing support buildup at immediate ATM boundary'],
    },
    exitDetails: {
      target1: `₹${target1}`,
      target2: `₹${target2}`,
      target3: `₹${target3}`,
      finalExitZone: `Trailing SL breakdown pattern triggers or ₹${target3}+ target completed`,
    },
    riskManagement: {
      stoploss: `₹${stoploss}`,
      trailingStoploss: `₹${trailingStoploss}`,
      riskLevel: 'Medium',
      capitalRiskPct: '1.5% to 2.0% per trade',
      riskRewardRatio: '1:2.4',
    },
    profitLossEstimation: {
      estimates: [
        {
          capital: 10000,
          qty: Math.floor(10000 / basePrice) || 1,
          estProfit: `₹${(Math.floor(10000 / basePrice) * (parseFloat(target2) - basePrice)).toFixed(2)}`,
          estLoss: `₹${(Math.floor(10000 / basePrice) * (basePrice - parseFloat(stoploss))).toFixed(2)}`,
        },
        {
          capital: 50000,
          qty: Math.floor(50000 / basePrice) || 1,
          estProfit: `₹${(Math.floor(50000 / basePrice) * (parseFloat(target2) - basePrice)).toFixed(2)}`,
          estLoss: `₹${(Math.floor(50000 / basePrice) * (basePrice - parseFloat(stoploss))).toFixed(2)}`,
        },
        {
          capital: 100000,
          qty: Math.floor(100000 / basePrice) || 1,
          estProfit: `₹${(Math.floor(100000 / basePrice) * (parseFloat(target2) - basePrice)).toFixed(2)}`,
          estLoss: `₹${(Math.floor(100000 / basePrice) * (basePrice - parseFloat(stoploss))).toFixed(2)}`,
        },
      ],
      positionSizing: 'Max 10% portfolio exposure allocation on single trade setups',
      marginRequirement: 'Standard cash market regular account equity, no leverage recommended',
      leverageRisk: 'For Derivatives/Intraday futures (5x), maximum risk expands. Keep position size low.',
    },
    multiLayerAnalysis: {
      technical: {
        priceAction: 'Consolidating in a classical ascending triangle with expanding volume nodes.',
        structure: 'HH-HL (Higher Highs, Higher Lows) structure maintained on 4H time chart.',
        liquidityZones: [`₹${(basePrice * 0.985).toFixed(2)} Sell Liquidity`, `₹${(basePrice * 1.02).toFixed(2)} Range Liquidity`],
        indicators: {
          RSI: '61.45 (Neutral bias to expanding momentum)',
          EMA_50_200: 'Bullish Golden Cross established on daily candle frame',
          VWAP: `₹${(basePrice * 0.999).toFixed(2)} supporting current structure`,
        },
      },
      fundamental: {
        valuation: `P/E of ${mockPE} is attractively lower than core sector peer median.`,
        growth: 'Topline revenue expanded by 14.8% YoY with sustained 18.2% operating profit margins.',
        metrics: {
          'ROCE %': '21.5%',
          'Debt to Equity': '0.12 (Sustained robust balance sheet)',
          'Promoters Stake': '54.6% (Unpledged)',
        },
      },
      derivatives: {
        oiBuildUp: 'Fresh long build-up with 8.4% spike in combined near-month contract open interest.',
        callPutWriting: 'Heavy put accumulation at immediate psychological strike zone; call writing capping breakout level.',
        pcr: 1.15,
        ivAnalysis: 'Implied Volatility (IV) stands moderate at 14.2, allowing attractive entry pricing for call buyers.',
      },
      sentiment: {
        newsSentiment: 'Highly positive. Leading global brokerages updated ratings with a 15% upward price target revision.',
        retailVsInstitutional: 'Institutional holding expanded by 1.8% in the last quarterly reporting cycle.',
        fearGreed: 'Local sentiment index at 68 (Slight greed but not overheated).',
      },
      macro: {
        rbiFedRates: 'RBI kept rates unchanged supporting domestic manufacturing CAPEX expansion.',
        inflationGdp: 'Domestic GDP growth forecast steady at 7.2%, CPI inflation cooled to 4.4% range.',
        globalCatalysts: 'Brent crude stability and positive US index futures provide optimal global drift backdrop.',
      },
    },
    hinglishExplanation: hinglishExplanation,
  };
}

function generateMockScanners() {
  return [
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', price: '₹174.50', changePct: 4.85, signal: 'BREAKOUT', reason: 'High-volume channel breakout on daily frame with heavy delivery block deals and global metal price surge.', volume: '18.4M shares' },
    { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defence & PSU', price: '₹4,380.00', changePct: 5.62, signal: 'SMART_MONEY', reason: 'Operator block deals and delivery spike exceed 55%. Strong technical gap recovery above 50-day EMA.', volume: '1.2M shares' },
    { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', sector: 'Railways', price: '₹378.10', changePct: 8.12, signal: 'MOMENTUM_SPIKE', reason: 'Fresh order acquisition news causing massive retail & institutional FOMO order-flow blocks.', volume: '12.4M shares' },
    { symbol: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defence & PSU', price: '₹285.40', changePct: -1.25, signal: 'LIQUIDITY_RUN', reason: 'Pullback into crucial demand order-block at 50-day EMA. Safe accumulation setup.', volume: '4.8M shares' },
    { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', price: '₹1,562.30', changePct: 3.14, signal: 'DELIVERY_SPIKE', reason: 'Delivery percentage spikes to 62% indicating high institutional transfer ahead of Q1 updates.', volume: '3.5M shares' },
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Conglomerate', price: '₹2,510.45', changePct: 1.25, signal: 'REVERSAL_CONFIRMED', reason: 'Double-bottom breakout on hourly chart backed by rising Put-Call Ratio (PCR).', volume: '2.8M shares' },
  ];
}

// Vite middleware development setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IndicTrade AI Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
