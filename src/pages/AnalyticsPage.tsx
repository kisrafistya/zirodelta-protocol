import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  // Mock analytics data
  const analyticsData = {
    totalVolume: 24500000,
    totalTVL: 89200000,
    activeUsers: 1234,
    totalTrades: 5678,
    volumeChange: 12.5,
    tvlChange: 8.3,
    usersChange: -2.1,
    tradesChange: 15.7,
  };

  // Mock chart data
  const volumeData = [
    { time: '00:00', volume: 1200000, trades: 45 },
    { time: '04:00', volume: 980000, trades: 38 },
    { time: '08:00', volume: 1800000, trades: 67 },
    { time: '12:00', volume: 2200000, trades: 89 },
    { time: '16:00', volume: 1950000, trades: 72 },
    { time: '20:00', volume: 2100000, trades: 81 },
  ];

  const marketData = [
    { market: 'BTC-PERP', volume: 8500000, tvl: 25000000, users: 456 },
    { market: 'ETH-PERP', volume: 6200000, tvl: 18500000, users: 342 },
    { market: 'SOL-PERP', volume: 4800000, tvl: 15200000, users: 267 },
    { market: 'AVAX-PERP', volume: 3200000, tvl: 12800000, users: 189 },
    { market: 'MATIC-PERP', volume: 1800000, tvl: 8900000, users: 123 },
  ];

  const tokenDistribution = [
    { name: 'PFRT', value: 52, color: '#059669' },
    { name: 'NFRT', value: 48, color: '#dc2626' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'price-positive' : 'price-negative';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Analytics Dashboard</CardTitle>
              <CardDescription>
                Track protocol metrics and market performance across all chains
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {['24h', '7d', '30d'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={timeRange === range ? 'bg-blue-600 text-white' : ''}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Volume</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(analyticsData.totalVolume)}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getChangeIcon(analyticsData.volumeChange), {
                    className: `h-3 w-3 mr-1 ${getChangeColor(analyticsData.volumeChange)}`
                  })}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.volumeChange)}`}>
                    {analyticsData.volumeChange >= 0 ? '+' : ''}{analyticsData.volumeChange.toFixed(1)}%
                  </span>
                </div>
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
                <p className="text-sm text-slate-600">Total TVL</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(analyticsData.totalTVL)}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getChangeIcon(analyticsData.tvlChange), {
                    className: `h-3 w-3 mr-1 ${getChangeColor(analyticsData.tvlChange)}`
                  })}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.tvlChange)}`}>
                    {analyticsData.tvlChange >= 0 ? '+' : ''}{analyticsData.tvlChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Users</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {analyticsData.activeUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getChangeIcon(analyticsData.usersChange), {
                    className: `h-3 w-3 mr-1 ${getChangeColor(analyticsData.usersChange)}`
                  })}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.usersChange)}`}>
                    {analyticsData.usersChange >= 0 ? '+' : ''}{analyticsData.usersChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Trades</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {analyticsData.totalTrades.toLocaleString()}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getChangeIcon(analyticsData.tradesChange), {
                    className: `h-3 w-3 mr-1 ${getChangeColor(analyticsData.tradesChange)}`
                  })}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.tradesChange)}`}>
                    {analyticsData.tradesChange >= 0 ? '+' : ''}{analyticsData.tradesChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="volume" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Trading Volume & Activity
              </CardTitle>
              <CardDescription>
                Volume and trade count over the last {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis yAxisId="left" stroke="#64748b" />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        color: '#334155'
                      }} 
                    />
                    <Bar yAxisId="left" dataKey="volume" fill="#3b82f6" opacity={0.6} />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="trades" 
                      stroke="#059669" 
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Market Performance
              </CardTitle>
              <CardDescription>
                Volume, TVL, and user metrics by market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.map((market, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {market.market.split('-')[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{market.market}</p>
                          <p className="text-sm text-slate-600">{market.users} active users</p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Rank #{index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Volume (24h)</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(market.volume)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">TVL</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(market.tvl)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
                <CardDescription>
                  PFRT vs NFRT token holdings across all markets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tokenDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tokenDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Percentage']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          color: '#334155'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-6">
                  {tokenDistribution.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-slate-600">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protocol Health</CardTitle>
                <CardDescription>
                  Key protocol metrics and indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Liquidity Utilization</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Average Epoch Success Rate</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Market Volatility Index</span>
                      <span className="font-medium">34%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Markets</span>
                    <span className="font-medium text-slate-900">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Active Epochs</span>
                    <span className="font-medium text-slate-900">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Avg Epoch Duration</span>
                    <span className="font-medium text-slate-900">24h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Real-time Updates
          </CardTitle>
          <CardDescription>
            Live protocol activity and recent events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 min ago', event: 'New epoch started for BTC-PERP', type: 'info' },
              { time: '5 min ago', event: 'Large position opened: 5,000 PFRT', type: 'activity' },
              { time: '12 min ago', event: 'ETH-PERP funding rate updated: +0.0234%', type: 'update' },
              { time: '18 min ago', event: 'SOL-PERP epoch concluded successfully', type: 'success' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'info' ? 'bg-blue-500' :
                    item.type === 'activity' ? 'bg-purple-500' :
                    item.type === 'update' ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-slate-900">{item.event}</span>
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
