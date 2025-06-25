import { useState, useEffect, useCallback, useRef } from 'react';
import { oracleService, FundingRateData, MarketData } from '@/services/oracleService';

export interface UseRealTimeDataOptions {
  symbol?: string;
  updateInterval?: number;
  enabled?: boolean;
}

export interface UseRealTimeDataReturn {
  currentRate: FundingRateData | null;
  marketData: MarketData | null;
  history: FundingRateData[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  refresh: () => void;
}

export const useRealTimeData = (options: UseRealTimeDataOptions = {}): UseRealTimeDataReturn => {
  const {
    symbol = 'BTC-PERP',
    updateInterval = 10000, // 10 seconds
    enabled = true
  } = options;

  const [currentRate, setCurrentRate] = useState<FundingRateData | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [history, setHistory] = useState<FundingRateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Get current funding rate
      const current = oracleService.getCurrentFundingRate(symbol);
      if (current) {
        setCurrentRate(current);
      }

      // Get market data
      const market = oracleService.getMarketData(symbol);
      if (market) {
        setMarketData(market);
      }

      // Get historical data (last 24 hours)
      const historyData = oracleService.getFundingRateHistory(symbol, 24);
      setHistory(historyData);

      setLastUpdate(Date.now());
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch real-time data:', err);
      setError(err.message || 'Failed to fetch data');
      setIsLoading(false);
    }
  }, [symbol]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    // Initial data fetch
    const initializeData = async () => {
      if (mounted) {
        await fetchData();
      }
    };

    initializeData();

    // Subscribe to oracle updates
    const unsubscribe = oracleService.subscribe((data: FundingRateData) => {
      if (!mounted || data.symbol !== symbol) return;

      setCurrentRate(data);
      setLastUpdate(Date.now());
      
      // Update history
      setHistory(prev => {
        const newHistory = [...prev];
        const existingIndex = newHistory.findIndex(
          item => Math.abs(item.timestamp - data.timestamp) < 60000 // Within 1 minute
        );
        
        if (existingIndex >= 0) {
          newHistory[existingIndex] = data;
        } else {
          newHistory.push(data);
          // Keep only last 24 hours
          const cutoff = Date.now() - (24 * 60 * 60 * 1000);
          return newHistory.filter(item => item.timestamp >= cutoff);
        }
        
        return newHistory;
      });

      // Update market data
      const market = oracleService.getMarketData(symbol);
      if (market) {
        setMarketData(market);
      }
    });

    unsubscribeRef.current = unsubscribe;

    // Set up periodic refresh
    intervalRef.current = setInterval(() => {
      if (mounted) {
        fetchData();
      }
    }, updateInterval);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [enabled, symbol, updateInterval]); // Removed fetchData from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    currentRate,
    marketData,
    history,
    isLoading,
    error,
    lastUpdate,
    refresh
  };
};

// Hook for multiple markets
export interface UseMultiMarketDataReturn {
  markets: Record<string, MarketData>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useMultiMarketData = (symbols: string[] = []): UseMultiMarketDataReturn => {
  const [markets, setMarkets] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setError(null);
      const marketData: Record<string, MarketData> = {};
      
      const symbolsToFetch = symbols.length > 0 ? symbols : oracleService.getAllMarkets();
      
      for (const symbol of symbolsToFetch) {
        const data = oracleService.getMarketData(symbol);
        if (data) {
          marketData[symbol] = data;
        }
      }
      
      setMarkets(marketData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch multi-market data:', err);
      setError(err.message || 'Failed to fetch market data');
      setIsLoading(false);
    }
  }, [symbols]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    fetchMarkets();

    // Subscribe to updates for all symbols
    const unsubscribe = oracleService.subscribe((data: FundingRateData) => {
      if (symbols.length === 0 || symbols.includes(data.symbol)) {
        setMarkets(prev => {
          const marketData = oracleService.getMarketData(data.symbol);
          if (marketData) {
            return {
              ...prev,
              [data.symbol]: marketData
            };
          }
          return prev;
        });
      }
    });

    // Periodic refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [symbols, fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    refresh
  };
};

// Hook for price data
export interface UsePriceDataReturn {
  prices: Record<string, number>;
  changes: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const usePriceData = (symbols: string[] = []): UsePriceDataReturn => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [changes, setChanges] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const priceData: Record<string, number> = {};
      const changeData: Record<string, number> = {};
      
      const symbolsToFetch = symbols.length > 0 ? symbols : oracleService.getAllMarkets();
      
      for (const symbol of symbolsToFetch) {
        const price = oracleService.getPrice(symbol);
        if (price) {
          priceData[symbol] = price.price;
          changeData[symbol] = price.change24h;
        }
      }
      
      setPrices(priceData);
      setChanges(changeData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch price data:', err);
      setError(err.message || 'Failed to fetch prices');
      setIsLoading(false);
    }
  }, [symbols]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    fetchPrices();
    
    // Update prices every 5 seconds
    const interval = setInterval(fetchPrices, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchPrices]);

  return {
    prices,
    changes,
    isLoading,
    error,
    refresh
  };
};
