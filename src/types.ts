/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EntryDetails {
  idealEntryZone: string;
  safeEntry: string;
  aggressiveEntry: string;
  bestEntryTiming: string;
  confirmationSignals: string[];
}

export interface ExitDetails {
  target1: string;
  target2: string;
  target3: string;
  finalExitZone: string;
}

export interface RiskManagement {
  stoploss: string;
  trailingStoploss: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  capitalRiskPct: string;
  riskRewardRatio: string;
}

export interface CapitalEstimate {
  capital: number;
  qty: number;
  estProfit: string;
  estLoss: string;
}

export interface ProfitLossEstimation {
  estimates: CapitalEstimate[];
  positionSizing: string;
  marginRequirement: string;
  leverageRisk: string;
}

export interface MultiLayerAnalysis {
  technical: {
    priceAction: string;
    structure: string;
    liquidityZones: string[];
    indicators: Record<string, string>;
  };
  fundamental: {
    valuation: string;
    growth: string;
    metrics: Record<string, string>;
  };
  derivatives: {
    oiBuildUp: string;
    callPutWriting: string;
    pcr: number;
    ivAnalysis: string;
  };
  sentiment: {
    newsSentiment: string;
    retailVsInstitutional: string;
    fearGreed: string;
  };
  macro: {
    rbiFedRates: string;
    inflationGdp: string;
    globalCatalysts: string;
  };
}

export interface TradeAlert {
  stockIndex: string;
  sector: string;
  currentPrice: string;
  tradeType: string; // Intraday / Swing / Scalping / Positional
  direction: 'BUY' | 'SELL';
  trendStrength: 'Bullish' | 'Bearish' | 'Sideways';
  confidenceScore: number; // 0-100
  probability: 'Low' | 'Medium' | 'High';
  entryDetails: EntryDetails;
  exitDetails: ExitDetails;
  riskManagement: RiskManagement;
  profitLossEstimation: ProfitLossEstimation;
  hinglishExplanation: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePct: number;
  isGlobal: boolean;
}

export interface ScannerItem {
  symbol: string;
  name: string;
  sector: string;
  price: string;
  changePct: number;
  signal: string;
  reason: string;
  volume: string;
}

export interface SectorStrength {
  name: string;
  score: number; // 0-100
  trend: 'Up' | 'Down' | 'Flat';
  leadingStock: string;
}
