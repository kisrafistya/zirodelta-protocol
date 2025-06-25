import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Shield, 
  ArrowRight,
  Zap,
  Globe,
  Users,
  CheckCircle,
  Play,
  Star,
  Coins,
  Activity,
  Lock,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HomePage: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    {
      label: 'Total Value Locked',
      value: '$247.8M',
      change: '+12.4%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      label: 'Active Markets',
      value: '8',
      change: '+2 New',
      changeType: 'positive',
      icon: BarChart3,
    },
    {
      label: 'ZDLT Price',
      value: '$1.24',
      change: '+5.8%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      label: 'Protocol Users',
      value: '12.4K',
      change: '+23.1%',
      changeType: 'positive',
      icon: Users,
    },
  ];

  const features = [
    {
      title: 'Conditional Tokens',
      description: 'Revolutionary PFRT and NFRT tokens that represent claims on collateral based on funding rate outcomes.',
      icon: Zap,
      highlights: ['No liquidation risk', 'Mathematical guarantees', '1:1 token conservation']
    },
    {
      title: 'Multi-Chain Support',
      description: 'Native support for both EVM (Ethereum) and SVM (Solana) ecosystems with seamless integration.',
      icon: Globe,
      highlights: ['EVM compatibility', 'Solana integration', 'Cross-chain ready']
    },
    {
      title: 'Advanced Oracle Network',
      description: 'Multi-source funding rate aggregation with time-weighted average pricing and dispute resolution.',
      icon: Shield,
      highlights: ['Real-time feeds', 'Dispute resolution', 'High reliability']
    },
    {
      title: 'Decentralized Governance',
      description: 'Community-driven governance through ZDLT token staking with transparent proposal and voting systems.',
      icon: Users,
      highlights: ['Voting rewards', 'Proposal creation', 'Treasury management']
    },
    {
      title: 'Professional Trading',
      description: 'Institutional-grade trading interface with advanced order types and comprehensive market analytics.',
      icon: BarChart3,
      highlights: ['Advanced orders', 'Market analytics', 'API access']
    },
    {
      title: 'Security First',
      description: 'Audited smart contracts with comprehensive security measures and transparent risk management.',
      icon: Lock,
      highlights: ['Smart contract audits', 'Insurance coverage', 'Bug bounty program']
    },
  ];

  // Mock chart data
  const chartData = [
    { time: '00:00', rate: 0.012 },
    { time: '04:00', rate: 0.018 },
    { time: '08:00', rate: -0.005 },
    { time: '12:00', rate: 0.024 },
    { time: '16:00', rate: 0.015 },
    { time: '20:00', rate: 0.008 },
  ];

  const benefits = [
    'Zero liquidation risk',
    'Institutional-grade security',
    'Real-time transparency',
    'Cross-chain compatibility',
    'Community governance',
    'Professional tools'
  ];

  const formatFundingRate = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(3)}%`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="mb-6">
                <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  Next-Generation DeFi Protocol
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Trade the Future of
                <span className="block text-blue-600">
                  Funding Rates
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Tokenize funding rates with revolutionary conditional tokens. 
                Experience zero-liquidation DeFi with mathematical guarantees and professional-grade tools.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Start Trading
                </Button>
                <Button variant="outline" className="px-8 py-4 text-lg">
                  Learn More
                </Button>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-slate-600">Audited by Certik</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-slate-600">$10M Insurance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-slate-600">AAA Security Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column - Demo Chart */}
            <div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Live Funding Rate - BTC-PERP
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-slate-900">+0.0156%</span>
                    <Badge className="bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +0.024%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={formatFundingRate} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            color: '#334155'
                          }}
                          formatter={(value) => [formatFundingRate(Number(value)), 'Funding Rate']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rate" 
                          stroke="#2563eb" 
                          strokeWidth={3}
                          dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Protocol Performance
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real-time metrics showcasing the growth and adoption of ZiroDelta Protocol
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} hover>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {stat.change}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How ZiroDelta Works
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Revolutionary conditional tokens that transform funding rate volatility into tradeable assets
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coins className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">1. Mint Token Pairs</h3>
                <p className="text-slate-600">
                  Deposit USDC collateral to mint PFRT and NFRT token pairs. Each pair represents claims on your collateral based on funding rate outcomes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">2. Trade & Speculate</h3>
                <p className="text-slate-600">
                  Trade tokens on our AMM or hold positions. PFRT appreciates when positive rates are expected, NFRT when negative rates are anticipated.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">3. Redeem Winners</h3>
                <p className="text-slate-600">
                  At epoch end, redeem your winning tokens for the full collateral amount. No liquidation risk, guaranteed by smart contracts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Advanced DeFi Infrastructure
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Built with institutional-grade technology for the next generation of decentralized finance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover>
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 mb-6">{feature.description}</p>
                  
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">
                Why Choose ZiroDelta?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg text-slate-700">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">Key Advantages</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">No Liquidation Risk</h4>
                        <p className="text-sm text-slate-600">Mathematical guarantees ensure your positions never get liquidated</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Instant Settlement</h4>
                        <p className="text-sm text-slate-600">Automatic settlement at epoch end with immediate redemption</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Advanced Analytics</h4>
                        <p className="text-sm text-slate-600">Real-time market data and comprehensive trading analytics</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders using ZiroDelta Protocol for advanced funding rate strategies and risk-free DeFi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mint">
              <Button className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 text-lg font-semibold">
                Start Minting Tokens
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/markets">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                Explore Markets
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
