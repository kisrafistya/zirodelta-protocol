import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/shared/Card';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Volume</p>
              <p className="text-2xl font-semibold text-slate-900">$2.4M</p>
              <p className="text-sm price-positive">+12.5%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Users</p>
              <p className="text-2xl font-semibold text-slate-900">1,234</p>
              <p className="text-sm price-positive">+8.2%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Price Change</p>
              <p className="text-2xl font-semibold text-slate-900">+5.67%</p>
              <p className="text-sm price-positive">Bullish</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Market Cap</p>
              <p className="text-2xl font-semibold text-slate-900">$45.2M</p>
              <p className="text-sm price-negative">-2.1%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <Card>
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>
              24-hour price movement for ZIRO token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
              <p className="text-slate-500">Chart component would go here</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest transactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Transaction #{i + 1}
                      </p>
                      <p className="text-xs text-slate-500">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      $1,234.56
                    </p>
                    <p className="text-xs text-slate-500">+2.5%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Ready to start trading?
              </h3>
              <p className="text-slate-600">
                Connect your wallet and start trading on ZiroDelta Protocol
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                Learn More
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Start Trading
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardDemo; 