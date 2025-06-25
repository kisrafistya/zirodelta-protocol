import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/shared/Card';
import { TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const MarketsPage: React.FC = () => {
  // Mock data for demonstration
  const marketData = [
    { symbol: 'ZIRO/USDC', price: '$2.45', change: '+5.67%', volume: '$2.4M', positive: true },
    { symbol: 'ZIRO/ETH', price: '0.00156', change: '-2.34%', volume: '$1.8M', positive: false },
    { symbol: 'ZIRO/BTC', price: '0.000045', change: '+12.5%', volume: '$3.2M', positive: true },
    { symbol: 'ZIRO/SOL', price: '0.0234', change: '+8.9%', volume: '$1.5M', positive: true },
  ];

  const topMetrics = [
    { title: 'Total Volume', value: '$12.4M', change: '+15.2%', icon: DollarSign, positive: true },
    { title: 'Active Pairs', value: '24', change: '+3', icon: TrendingUp, positive: true },
    { title: 'Liquidity', value: '$45.6M', change: '+8.1%', icon: Zap, positive: true },
    { title: 'Market Cap', value: '$156M', change: '-1.2%', icon: TrendingDown, positive: false },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle>Markets Overview</CardTitle>
          <CardDescription>
            Real-time trading data and market metrics for ZiroDelta Protocol
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} hover>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{metric.title}</p>
                  <p className="text-2xl font-semibold text-slate-900">{metric.value}</p>
                  <p className={`text-sm font-medium ${
                    metric.positive ? 'price-positive' : 'price-negative'
                  }`}>
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  metric.positive ? 'bg-blue-100' : 'bg-red-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    metric.positive ? 'text-blue-600' : 'text-red-600'
                  }`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trading Pairs */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>
            Available trading pairs and their current market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Pair</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">24h Change</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Volume</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((pair, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                        <span className="font-medium text-slate-900">{pair.symbol}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-medium text-slate-900">
                      {pair.price}
                    </td>
                    <td className={`py-4 px-4 text-right font-medium ${
                      pair.positive ? 'price-positive' : 'price-negative'
                    }`}>
                      {pair.change}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-600">
                      {pair.volume}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Trade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Trading</CardTitle>
            <CardDescription>
              Quick access to trading features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Open Trading Interface
            </Button>
            <Button variant="outline" className="w-full">
              View Order Book
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
            <CardDescription>
              Advanced tools and analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Technical Analysis
            </Button>
            <Button variant="outline" className="w-full">
              Price History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketsPage;
