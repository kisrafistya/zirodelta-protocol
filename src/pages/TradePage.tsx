import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown,
  DollarSign,
  Clock,
  Info,
  Zap,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TradePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedMarket = searchParams.get('market') || 'btc-perp';
  const { isConnected, getBalance, chain } = useWallet();
  
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tokenType, setTokenType] = useState<'PFRT' | 'NFRT'>('PFRT');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  // Mock market data
  const marketData = {
    symbol: 'BTC-PERP',
    fundingRate: 0.0156,
    pfrtPrice: 0.54,
    nfrtPrice: 0.46,
    volume24h: 24500000,
    nextEpoch: '2h 34m',
    chain: 'EVM'
  };

  // Mock price chart data
  const priceData = [
    { time: '00:00', pfrt: 0.52, nfrt: 0.48 },
    { time: '04:00', pfrt: 0.51, nfrt: 0.49 },
    { time: '08:00', pfrt: 0.49, nfrt: 0.51 },
    { time: '12:00', pfrt: 0.53, nfrt: 0.47 },
    { time: '16:00', pfrt: 0.55, nfrt: 0.45 },
    { time: '20:00', pfrt: 0.54, nfrt: 0.46 },
  ];

  // Mock order book data
  const orderBook = {
    bids: [
      { price: 0.539, amount: 1250, total: 1250 },
      { price: 0.538, amount: 890, total: 2140 },
      { price: 0.537, amount: 1560, total: 3700 },
      { price: 0.536, amount: 2100, total: 5800 },
      { price: 0.535, amount: 950, total: 6750 },
    ],
    asks: [
      { price: 0.541, amount: 980, total: 980 },
      { price: 0.542, amount: 1340, total: 2320 },
      { price: 0.543, amount: 750, total: 3070 },
      { price: 0.544, amount: 1890, total: 4960 },
      { price: 0.545, amount: 1200, total: 6160 },
    ]
  };

  const currentPrice = tokenType === 'PFRT' ? marketData.pfrtPrice : marketData.nfrtPrice;

  useEffect(() => {
    setPrice(currentPrice.toString());
  }, [tokenType, currentPrice]);

  const handleTrade = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    const tradeAmount = parseFloat(amount);
    const tradePrice = parseFloat(price);
    
    if (!tradeAmount || !tradePrice) {
      alert('Please enter valid amount and price');
      return;
    }

    const total = tradeAmount * tradePrice;
    const fee = total * 0.003; // 0.3% trading fee

    alert(`Trade submitted!\n${tradeType.toUpperCase()} ${tradeAmount} ${tokenType}\nPrice: $${tradePrice}\nTotal: $${total.toFixed(2)}\nFee: $${fee.toFixed(2)}`);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-6">
      {/* Market Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CardTitle className="text-2xl">{marketData.symbol}</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">
                {marketData.chain}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-slate-600">Next epoch: {marketData.nextEpoch}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-600">Funding Rate</p>
              <p className={`text-xl font-semibold ${marketData.fundingRate >= 0 ? 'price-positive' : 'price-negative'}`}>
                {(marketData.fundingRate * 100).toFixed(3)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">24h Volume</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(marketData.volume24h)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">PFRT Price</p>
              <p className="text-xl font-semibold text-slate-900">${marketData.pfrtPrice.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">NFRT Price</p>
              <p className="text-xl font-semibold text-slate-900">${marketData.nfrtPrice.toFixed(3)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpDown className="h-5 w-5 mr-2 text-blue-600" />
                Trade Conditional Tokens
              </CardTitle>
              <CardDescription>
                Buy or sell PFRT/NFRT tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Token</label>
                <Tabs value={tokenType} onValueChange={(value) => setTokenType(value as 'PFRT' | 'NFRT')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="PFRT">PFRT</TabsTrigger>
                    <TabsTrigger value="NFRT">NFRT</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Trade Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Type</label>
                <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 mt-1">
                  <span>Balance: {getBalance(tokenType === 'PFRT' ? 'PFRT' : 'NFRT').toFixed(2)} {tokenType}</span>
                  <button 
                    onClick={() => setAmount(getBalance(tokenType === 'PFRT' ? 'PFRT' : 'NFRT').toString())}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Price (ZDLT)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-600 mt-1">
                  <span>Market: {currentPrice.toFixed(3)} ZDLT</span>
                  <button 
                    onClick={() => setPrice(currentPrice.toString())}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Market
                  </button>
                </div>
              </div>

              {/* Trade Summary */}
              {amount && price && (
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total</span>
                      <span className="font-medium">{(parseFloat(amount) * parseFloat(price)).toFixed(2)} ZDLT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Trading Fee (0.3%)</span>
                      <span className="font-medium">{(parseFloat(amount) * parseFloat(price) * 0.003).toFixed(4)} ZDLT</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium text-slate-900">Net Total</span>
                      <span className="font-semibold">{(parseFloat(amount) * parseFloat(price) * 1.003).toFixed(2)} ZDLT</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Button */}
              <Button 
                onClick={handleTrade}
                disabled={!isConnected || !amount || !price}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {!isConnected ? 'Connect Wallet' : `${tradeType.toUpperCase()} ${tokenType}`}
              </Button>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Conditional Token Info</p>
                    <p className="text-blue-700">
                      {tokenType === 'PFRT' 
                        ? 'PFRT tokens are redeemable for collateral if the funding rate is positive at epoch end.'
                        : 'NFRT tokens are redeemable for collateral if the funding rate is zero or negative at epoch end.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Order Book */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                PFRT/NFRT Price Chart (24H)
              </CardTitle>
              <CardDescription>
                Real-time price movements for conditional tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0.4, 0.6]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        color: '#334155'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pfrt" 
                      stroke="#059669" 
                      strokeWidth={2}
                      name="PFRT"
                      dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nfrt" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="NFRT"
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Book */}
          <Card>
            <CardHeader>
              <CardTitle>Order Book - {tokenType}</CardTitle>
              <CardDescription>
                Current buy and sell orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sell Orders */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                    Sell Orders
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 mb-2 px-2">
                      <span>Price</span>
                      <span>Amount</span>
                      <span>Total</span>
                    </div>
                    {orderBook.asks.reverse().map((order, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 hover:bg-red-50 px-2 rounded transition-colors">
                        <span className="price-negative font-mono">{order.price.toFixed(3)}</span>
                        <span className="text-slate-700">{order.amount}</span>
                        <span className="text-slate-500">{order.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy Orders */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Buy Orders
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 mb-2 px-2">
                      <span>Price</span>
                      <span>Amount</span>
                      <span>Total</span>
                    </div>
                    {orderBook.bids.map((order, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 hover:bg-green-50 px-2 rounded transition-colors">
                        <span className="price-positive font-mono">{order.price.toFixed(3)}</span>
                        <span className="text-slate-700">{order.amount}</span>
                        <span className="text-slate-500">{order.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Spread</span>
                  <span className="font-medium text-slate-900">0.002 (0.37%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradePage;
