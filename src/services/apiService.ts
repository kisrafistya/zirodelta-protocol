import environment, { isMockDataEnabled } from '@/config/environment';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface FundingRateApiData {
  symbol: string;
  rate: number;
  timestamp: number;
  source: string;
  confidence: number;
}

export interface MarketApiData {
  id: string;
  symbol: string;
  pfrtToken: string;
  nfrtToken: string;
  collateralToken: string;
  expirationTime: number;
  totalCollateral: number;
  isActive: boolean;
  volume24h?: number;
  pfrtPrice?: number;
  nfrtPrice?: number;
}

export interface PriceApiData {
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
}

export interface AnalyticsApiData {
  totalVolume: number;
  totalTVL: number;
  activeUsers: number;
  totalTrades: number;
  volumeChange: number;
  tvlChange: number;
  usersChange: number;
  tradesChange: number;
}

class ApiService {
  private baseUrl: string;
  private wsConnection: WebSocket | null = null;
  private subscribers = new Map<string, Set<(data: any) => void>>();

  constructor() {
    this.baseUrl = environment.apiBaseUrl;
  }

  // Generic API call method
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Funding Rate API
  async getFundingRates(symbols?: string[]): Promise<ApiResponse<FundingRateApiData[]>> {
    if (isMockDataEnabled()) {
      return this.getMockFundingRates(symbols);
    }

    const symbolQuery = symbols ? `?symbols=${symbols.join(',')}` : '';
    return this.makeRequest<FundingRateApiData[]>(`/api/funding-rates${symbolQuery}`);
  }

  async getFundingRateHistory(symbol: string, hours: number = 24): Promise<ApiResponse<FundingRateApiData[]>> {
    if (isMockDataEnabled()) {
      return this.getMockFundingRateHistory(symbol, hours);
    }

    return this.makeRequest<FundingRateApiData[]>(`/api/funding-rates/${symbol}/history?hours=${hours}`);
  }

  // Markets API
  async getMarkets(): Promise<ApiResponse<MarketApiData[]>> {
    if (isMockDataEnabled()) {
      return this.getMockMarkets();
    }

    return this.makeRequest<MarketApiData[]>('/api/markets');
  }

  async getMarket(id: string): Promise<ApiResponse<MarketApiData>> {
    if (isMockDataEnabled()) {
      return this.getMockMarket(id);
    }

    return this.makeRequest<MarketApiData>(`/api/markets/${id}`);
  }

  // Prices API
  async getPrices(symbols?: string[]): Promise<ApiResponse<PriceApiData[]>> {
    if (isMockDataEnabled()) {
      return this.getMockPrices(symbols);
    }

    const symbolQuery = symbols ? `?symbols=${symbols.join(',')}` : '';
    return this.makeRequest<PriceApiData[]>(`/api/prices${symbolQuery}`);
  }

  // Analytics API
  async getAnalytics(timeRange: string = '24h'): Promise<ApiResponse<AnalyticsApiData>> {
    if (isMockDataEnabled()) {
      return this.getMockAnalytics();
    }

    return this.makeRequest<AnalyticsApiData>(`/api/analytics?timeRange=${timeRange}`);
  }

  // WebSocket for real-time updates
  connectWebSocket(): void {
    if (!environment.features.enableRealTimeUpdates || this.wsConnection) return;

    try {
      this.wsConnection = new WebSocket(environment.wsBaseUrl);

      this.wsConnection.onopen = () => {
        console.log('WebSocket connected');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifySubscribers(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('WebSocket disconnected');
        this.wsConnection = null;
        // Retry connection after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscribers.clear();
  }

  // Mock data methods (for development)
  private async getMockFundingRates(symbols?: string[]): Promise<ApiResponse<FundingRateApiData[]>> {
    const mockSymbols = symbols || ['BTC-PERP', 'ETH-PERP', 'SOL-PERP'];
    const mockData: FundingRateApiData[] = mockSymbols.map(symbol => ({
      symbol,
      rate: (Math.random() - 0.5) * 0.002,
      timestamp: Date.now(),
      source: 'mock',
      confidence: 0.95 + Math.random() * 0.05
    }));

    return {
      success: true,
      data: mockData,
      timestamp: Date.now()
    };
  }

  private async getMockFundingRateHistory(symbol: string, hours: number): Promise<ApiResponse<FundingRateApiData[]>> {
    const history: FundingRateApiData[] = [];
    let currentRate = (Math.random() - 0.5) * 0.002;

    for (let i = hours; i >= 0; i--) {
      const timestamp = Date.now() - (i * 60 * 60 * 1000);
      currentRate += (Math.random() - 0.5) * 0.0005;
      
      history.push({
        symbol,
        rate: currentRate,
        timestamp,
        source: 'mock',
        confidence: 0.95 + Math.random() * 0.05
      });
    }

    return {
      success: true,
      data: history,
      timestamp: Date.now()
    };
  }

  private async getMockMarkets(): Promise<ApiResponse<MarketApiData[]>> {
    const mockData: MarketApiData[] = [
      {
        id: 'btc-perp',
        symbol: 'BTC-PERP',
        pfrtToken: '0x1234567890abcdef1234567890abcdef12345678',
        nfrtToken: '0xabcdef1234567890abcdef1234567890abcdef12',
        collateralToken: '0xa0b86a33e6c3fa',
        expirationTime: Date.now() + (2 * 60 * 60 * 1000),
        totalCollateral: 89200000,
        isActive: true,
        volume24h: 24500000,
        pfrtPrice: 0.54,
        nfrtPrice: 0.46
      },
      {
        id: 'eth-perp',
        symbol: 'ETH-PERP',
        pfrtToken: '0x2345678901bcdef12345678901bcdef123456789',
        nfrtToken: '0xbcdef123456789abcdef123456789abcdef123456',
        collateralToken: '0xa0b86a33e6c3fa',
        expirationTime: Date.now() + (2 * 60 * 60 * 1000),
        totalCollateral: 67800000,
        isActive: true,
        volume24h: 18200000,
        pfrtPrice: 0.48,
        nfrtPrice: 0.52
      }
    ];

    return {
      success: true,
      data: mockData,
      timestamp: Date.now()
    };
  }

  private async getMockMarket(id: string): Promise<ApiResponse<MarketApiData>> {
    const markets = await this.getMockMarkets();
    const market = markets.data?.find(m => m.id === id);

    if (market) {
      return {
        success: true,
        data: market,
        timestamp: Date.now()
      };
    }

    return {
      success: false,
      error: 'Market not found',
      timestamp: Date.now()
    };
  }

  private async getMockPrices(symbols?: string[]): Promise<ApiResponse<PriceApiData[]>> {
    const basePrices: Record<string, number> = {
      'BTC-PERP': 67500,
      'ETH-PERP': 3450,
      'SOL-PERP': 145,
      'ZDLT': 1.24
    };

    const mockSymbols = symbols || Object.keys(basePrices);
    const mockData: PriceApiData[] = mockSymbols.map(symbol => ({
      symbol,
      price: (basePrices[symbol] || 1) * (0.98 + Math.random() * 0.04),
      timestamp: Date.now(),
      change24h: (Math.random() - 0.5) * 0.1
    }));

    return {
      success: true,
      data: mockData,
      timestamp: Date.now()
    };
  }

  private async getMockAnalytics(): Promise<ApiResponse<AnalyticsApiData>> {
    const mockData: AnalyticsApiData = {
      totalVolume: 24500000,
      totalTVL: 89200000,
      activeUsers: 1234,
      totalTrades: 5678,
      volumeChange: 12.5,
      tvlChange: 8.3,
      usersChange: -2.1,
      tradesChange: 15.7
    };

    return {
      success: true,
      data: mockData,
      timestamp: Date.now()
    };
  }
}

export const apiService = new ApiService();
export default apiService; 