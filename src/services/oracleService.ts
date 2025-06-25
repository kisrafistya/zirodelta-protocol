// Oracle Service for simulating real-time funding rate data
export interface FundingRateData {
  symbol: string;
  rate: number;
  timestamp: number;
  source: string;
  confidence: number;
}

export interface OraclePrice {
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
}

export interface MarketData {
  symbol: string;
  fundingRate: number;
  nextFundingTime: number;
  avgFundingRate8h: number;
  predictedRate: number;
  openInterest: number;
  volume24h: number;
}

class OracleService {
  private dataStreams = new Map<string, FundingRateData[]>();
  private priceStreams = new Map<string, OraclePrice>();
  private subscribers = new Set<(data: FundingRateData) => void>();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMockData();
    this.startDataStream();
  }

  private initializeMockData(): void {
    const markets = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'AVAX-PERP', 'MATIC-PERP', 'ADA-PERP', 'DOT-PERP', 'LINK-PERP'];
    
    markets.forEach(market => {
      // Initialize historical data
      const history: FundingRateData[] = [];
      let currentRate = (Math.random() - 0.5) * 0.002; // -0.1% to 0.1%
      
      for (let i = 168; i >= 0; i--) { // 7 days of hourly data
        const timestamp = Date.now() - (i * 60 * 60 * 1000);
        const rate = currentRate + (Math.random() - 0.5) * 0.0005; // Add volatility
        
        history.push({
          symbol: market,
          rate,
          timestamp,
          source: this.getRandomSource(),
          confidence: 0.95 + Math.random() * 0.05
        });
        
        currentRate = rate;
      }
      
      this.dataStreams.set(market, history);
    });

    // Initialize price data
    const basePrices = {
      'BTC-PERP': 67500,
      'ETH-PERP': 3450,
      'SOL-PERP': 145,
      'AVAX-PERP': 32,
      'MATIC-PERP': 0.87,
      'ADA-PERP': 0.45,
      'DOT-PERP': 7.2,
      'LINK-PERP': 15.8
    };

    Object.entries(basePrices).forEach(([symbol, basePrice]) => {
      this.priceStreams.set(symbol, {
        symbol,
        price: basePrice * (0.98 + Math.random() * 0.04), // ±2% variation
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * 0.1 // ±5% change
      });
    });
  }

  private getRandomSource(): string {
    const sources = ['Binance', 'Bybit', 'dYdX', 'FTX', 'OKX', 'Coinbase'];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  private startDataStream(): void {
    // Update funding rates every 10 seconds for demo
    this.intervalId = setInterval(() => {
      this.updateFundingRates();
    }, 10000);
  }

  private updateFundingRates(): void {
    this.dataStreams.forEach((history, market) => {
      const lastRate = history[history.length - 1];
      const newRate = lastRate.rate + (Math.random() - 0.5) * 0.0001; // Small updates
      
      const newData: FundingRateData = {
        symbol: market,
        rate: newRate,
        timestamp: Date.now(),
        source: this.getRandomSource(),
        confidence: 0.95 + Math.random() * 0.05
      };

      // Keep only last 168 hours (7 days)
      if (history.length >= 168) {
        history.shift();
      }
      history.push(newData);

      // Notify subscribers
      this.subscribers.forEach(callback => callback(newData));
    });
  }

  getCurrentFundingRate(symbol: string): FundingRateData | null {
    const history = this.dataStreams.get(symbol);
    return history ? history[history.length - 1] : null;
  }

  getFundingRateHistory(symbol: string, hours: number = 24): FundingRateData[] {
    const history = this.dataStreams.get(symbol) || [];
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return history.filter(data => data.timestamp >= cutoff);
  }

  getMarketData(symbol: string): MarketData | null {
    const currentRate = this.getCurrentFundingRate(symbol);
    const history = this.getFundingRateHistory(symbol, 8);
    
    if (!currentRate) return null;

    const avgFundingRate8h = history.reduce((sum, data) => sum + data.rate, 0) / history.length;
    const predictedRate = avgFundingRate8h + (Math.random() - 0.5) * 0.0002;

    return {
      symbol,
      fundingRate: currentRate.rate,
      nextFundingTime: this.getNextFundingTime(),
      avgFundingRate8h,
      predictedRate,
      openInterest: 150000000 + Math.random() * 50000000, // Mock OI
      volume24h: 80000000 + Math.random() * 40000000 // Mock volume
    };
  }

  private getNextFundingTime(): number {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return nextHour.getTime();
  }

  getPrice(symbol: string): OraclePrice | null {
    return this.priceStreams.get(symbol) || null;
  }

  getAllMarkets(): string[] {
    return Array.from(this.dataStreams.keys());
  }

  subscribe(callback: (data: FundingRateData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Simulate multi-source aggregation
  getAggregatedRate(symbol: string): {
    rate: number;
    sources: Array<{ source: string; rate: number; weight: number }>;
    confidence: number;
  } {
    const baseRate = this.getCurrentFundingRate(symbol)?.rate || 0;
    const sources = [
      { source: 'Binance', rate: baseRate + (Math.random() - 0.5) * 0.0001, weight: 0.3 },
      { source: 'Bybit', rate: baseRate + (Math.random() - 0.5) * 0.0001, weight: 0.25 },
      { source: 'dYdX', rate: baseRate + (Math.random() - 0.5) * 0.0001, weight: 0.2 },
      { source: 'OKX', rate: baseRate + (Math.random() - 0.5) * 0.0001, weight: 0.15 },
      { source: 'Coinbase', rate: baseRate + (Math.random() - 0.5) * 0.0001, weight: 0.1 }
    ];

    const weightedRate = sources.reduce((sum, source) => sum + (source.rate * source.weight), 0);
    const confidence = 0.92 + Math.random() * 0.06;

    return {
      rate: weightedRate,
      sources,
      confidence
    };
  }

  // Simulate oracle disputes and resolution
  getDisputeStatus(symbol: string): {
    hasDispute: boolean;
    disputeReason?: string;
    resolutionTime?: number;
    disputeId?: string;
  } {
    const hasDispute = Math.random() < 0.05; // 5% chance of dispute
    
    if (!hasDispute) {
      return { hasDispute: false };
    }

    const reasons = [
      'Source data discrepancy',
      'Network latency issues',
      'Exchange API outage',
      'Abnormal price movement'
    ];

    return {
      hasDispute: true,
      disputeReason: reasons[Math.floor(Math.random() * reasons.length)],
      resolutionTime: Date.now() + (30 * 60 * 1000), // 30 minutes
      disputeId: `DISP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.subscribers.clear();
  }
}

// Global oracle service instance
export const oracleService = new OracleService();

// Utility functions for formatting
export const formatFundingRate = (rate: number): string => {
  const percentage = (rate * 100).toFixed(4);
  return `${rate >= 0 ? '+' : ''}${percentage}%`;
};

export const formatTimeUntilFunding = (timestamp: number): string => {
  const now = Date.now();
  const diff = timestamp - now;
  
  if (diff <= 0) return 'Funding now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getFundingRateColor = (rate: number): string => {
  if (rate > 0) return 'text-green-400';
  if (rate < 0) return 'text-red-400';
  return 'text-gray-400';
};
