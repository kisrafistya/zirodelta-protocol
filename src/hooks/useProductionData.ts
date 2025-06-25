import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, ApiResponse } from '@/services/apiService';
import environment from '@/config/environment';

// Base hook for handling API calls with loading states
export function useApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  autoFetch: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
        setLastUpdated(response.timestamp);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
    isStale: lastUpdated ? (Date.now() - lastUpdated > 60000) : true // 1 minute staleness
  };
}

// Real-time funding rate data
export function useRealTimeFundingRates(symbols?: string[]) {
  const [subscriptions, setSubscriptions] = useState<(() => void)[]>([]);
  const {
    data: fundingRates,
    isLoading,
    error,
    refetch
  } = useApiCall(
    () => apiService.getFundingRates(symbols),
    [symbols],
    true
  );

  useEffect(() => {
    if (!environment.features.enableRealTimeUpdates) return;

    // Connect WebSocket for real-time updates
    apiService.connectWebSocket();

    // Subscribe to funding rate updates
    const unsubscribeFunding = apiService.subscribe('funding-rates', (data) => {
      if (!symbols || symbols.includes(data.symbol)) {
        refetch(); // Refresh data when updates come in
      }
    });

    setSubscriptions([unsubscribeFunding]);

    return () => {
      subscriptions.forEach(unsub => unsub());
      setSubscriptions([]);
    };
  }, [symbols, refetch]);

  return {
    fundingRates: fundingRates || [],
    isLoading,
    error,
    refetch,
    getCurrentRate: (symbol: string) => {
      return fundingRates?.find(rate => rate.symbol === symbol);
    }
  };
}

// Historical funding rate data
export function useFundingRateHistory(symbol: string, hours: number = 24) {
  return useApiCall(
    () => apiService.getFundingRateHistory(symbol, hours),
    [symbol, hours],
    true
  );
}

// Market data with real-time updates
export function useMarketData(marketId?: string) {
  const [subscriptions, setSubscriptions] = useState<(() => void)[]>([]);
  
  const marketsCall = useApiCall(
    () => apiService.getMarkets(),
    [],
    !marketId
  );

  const singleMarketCall = useApiCall(
    () => marketId ? apiService.getMarket(marketId) : Promise.resolve({ success: false, timestamp: Date.now() }),
    [marketId],
    !!marketId
  );

  useEffect(() => {
    if (!environment.features.enableRealTimeUpdates) return;

    apiService.connectWebSocket();

    const unsubscribeMarkets = apiService.subscribe('markets', () => {
      if (marketId) {
        singleMarketCall.refetch();
      } else {
        marketsCall.refetch();
      }
    });

    setSubscriptions([unsubscribeMarkets]);

    return () => {
      subscriptions.forEach(unsub => unsub());
      setSubscriptions([]);
    };
  }, [marketId]);

  if (marketId) {
    return {
      market: singleMarketCall.data,
      isLoading: singleMarketCall.isLoading,
      error: singleMarketCall.error,
      refetch: singleMarketCall.refetch
    };
  }

  return {
    markets: marketsCall.data || [],
    isLoading: marketsCall.isLoading,
    error: marketsCall.error,
    refetch: marketsCall.refetch
  };
}

// Price data with real-time updates
export function usePriceData(symbols?: string[]) {
  const [subscriptions, setSubscriptions] = useState<(() => void)[]>([]);
  const updateInterval = useRef<NodeJS.Timeout>();

  const {
    data: prices,
    isLoading,
    error,
    refetch
  } = useApiCall(
    () => apiService.getPrices(symbols),
    [symbols],
    true
  );

  useEffect(() => {
    if (!environment.features.enableRealTimeUpdates) return;

    apiService.connectWebSocket();

    // Subscribe to price updates
    const unsubscribePrices = apiService.subscribe('prices', (data) => {
      if (!symbols || symbols.includes(data.symbol)) {
        refetch();
      }
    });

    setSubscriptions([unsubscribePrices]);

    // Fallback polling every 30 seconds
    updateInterval.current = setInterval(() => {
      refetch();
    }, 30000);

    return () => {
      subscriptions.forEach(unsub => unsub());
      setSubscriptions([]);
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [symbols, refetch]);

  return {
    prices: prices || [],
    isLoading,
    error,
    refetch,
    getPrice: (symbol: string) => {
      return prices?.find(price => price.symbol === symbol);
    }
  };
}

// Analytics data
export function useAnalyticsData(timeRange: string = '24h') {
  return useApiCall(
    () => apiService.getAnalytics(timeRange),
    [timeRange],
    true
  );
}

// Portfolio data (requires user wallet connection)
export function usePortfolioData(walletAddress?: string) {
  return useApiCall(
    async () => {
      if (!walletAddress) {
        return { success: false, error: 'Wallet not connected', timestamp: Date.now() };
      }
      
      // This would be implemented when the portfolio API is ready
      return { 
        success: true, 
        data: {
          totalValue: 0,
          assets: [],
          positions: []
        }, 
        timestamp: Date.now() 
      };
    },
    [walletAddress],
    !!walletAddress
  );
}

// Health check for API connectivity
export function useApiHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  const checkHealth = useCallback(async () => {
    try {
      // Create AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${environment.apiBaseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setIsHealthy(response.ok);
      setLastCheck(Date.now());
    } catch (error) {
      setIsHealthy(false);
      setLastCheck(Date.now());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    lastCheck,
    checkHealth
  };
} 