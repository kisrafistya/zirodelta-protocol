import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Coins,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const PortfolioPage: React.FC = () => {
  const { isConnected, getBalance, chain } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  // Mock portfolio data
  const portfolioData = {
    totalValue: 12450.67,
    totalChange: 234.89,
    totalChangePercent: 1.92,
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: 5000.00,
        value: 5000.00,
        change: 0,
        changePercent: 0,
        type: 'stable'
      },
      {
        symbol: 'PFRT',
        name: 'Positive Rate Token',
        balance: 2500.00,
        value: 1350.00,
        change: 125.50,
        changePercent: 10.24,
        type: 'conditional'
      },
      {
        symbol: 'NFRT',
        name: 'Negative Rate Token',
        balance: 2000.00,
        value: 920.00,
        change: -80.30,
        changePercent: -8.03,
        type: 'conditional'
      },
      {
        symbol: 'ZDLT',
        name: 'ZiroDelta Token',
        balance: 10000.00,
        value: 5180.67,
        change: 189.69,
        changePercent: 3.80,
        type: 'governance'
      }
    ],
    positions: [
      {
        market: 'BTC-PERP',
        type: 'PFRT',
        amount: 1500.00,
        entryPrice: 0.52,
        currentPrice: 0.54,
        pnl: 57.69,
        pnlPercent: 3.85,
        epochEnd: '2h 34m',
        status: 'active'
      },
      {
        market: 'ETH-PERP',
        type: 'NFRT',
        amount: 800.00,
        entryPrice: 0.68,
        currentPrice: 0.69,
        pnl: 8.00,
        pnlPercent: 1.47,
        epochEnd: '2h 34m',
        status: 'active'
      },
      {
        market: 'SOL-PERP',
        type: 'PFRT',
        amount: 1000.00,
        entryPrice: 0.65,
        currentPrice: 0.67,
        pnl: 30.77,
        pnlPercent: 4.73,
        epochEnd: '6h 12m',
        status: 'active'
      }
    ]
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'stable':
        return 'bg-gray-100 text-gray-800';
      case 'conditional':
        return 'bg-blue-100 text-blue-800';
      case 'governance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Connect Your Wallet</h3>
            <p className="text-slate-600 mb-6">
              Connect your wallet to view your portfolio and manage your positions
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
              <CardDescription>
                Track your assets and positions across all markets
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">
                {chain}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Value</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(portfolioData.totalValue)}
                </p>
                <p className={`text-sm font-medium flex items-center mt-1 ${
                  portfolioData.totalChange >= 0 ? 'price-positive' : 'price-negative'
                }`}>
                  {portfolioData.totalChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {formatCurrency(Math.abs(portfolioData.totalChange))} ({portfolioData.totalChangePercent.toFixed(2)}%)
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Positions</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {portfolioData.positions.filter(p => p.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Across {new Set(portfolioData.positions.map(p => p.market)).size} markets
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Coins className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Assets</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {portfolioData.assets.length}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Tokens in wallet
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Details */}
      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Asset Holdings</CardTitle>
              <CardDescription>
                Your current token balances and their values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioData.assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {asset.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-slate-900">{asset.symbol}</p>
                          <Badge className={getAssetTypeColor(asset.type)}>{asset.type}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(asset.value)}</p>
                      <p className="text-sm text-slate-600">{asset.balance.toLocaleString()} {asset.symbol}</p>
                      {asset.change !== 0 && (
                        <p className={`text-sm font-medium ${
                          asset.change >= 0 ? 'price-positive' : 'price-negative'
                        }`}>
                          {asset.change >= 0 ? '+' : ''}{formatCurrency(asset.change)} ({asset.changePercent.toFixed(2)}%)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>
                Your conditional token positions across different markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioData.positions.map((position, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          position.type === 'PFRT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {position.type}
                        </div>
                        <span className="font-medium text-slate-900">{position.market}</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {position.epochEnd}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          position.pnl >= 0 ? 'price-positive' : 'price-negative'
                        }`}>
                          {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                        </p>
                        <p className={`text-sm ${
                          position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Amount</p>
                        <p className="font-medium">{position.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Entry Price</p>
                        <p className="font-medium">${position.entryPrice.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Current Price</p>
                        <p className="font-medium">${position.currentPrice.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Status</p>
                        <p className="font-medium text-green-600 capitalize">{position.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your portfolio and positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white justify-center">
              <Coins className="mr-2 h-4 w-4" />
              Mint New Tokens
            </Button>
            <Button variant="outline" className="justify-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trade Positions
            </Button>
            <Button variant="outline" className="justify-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Warning */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-slate-900 mb-1">Portfolio Risk Notice</p>
              <p className="text-slate-600">
                Conditional tokens carry inherent risks. Monitor your positions closely and be aware that only one token type per market will be redeemable at epoch end. Consider diversifying across multiple markets and time horizons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioPage;
