import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Coins,
  ArrowDown,
  Clock,
  Info,
  Shield,
  Zap,
  Plus,
  Wallet
} from 'lucide-react';

const MintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedMarket = searchParams.get('market') || 'btc-perp';
  const { isConnected, getBalance, chain } = useWallet();
  
  const [collateralAmount, setCollateralAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock market data
  const marketData = {
    symbol: 'BTC-PERP',
    fundingRate: 0.0156,
    nextEpoch: '2h 34m',
    epochProgress: 65,
    mintingFee: 0.001, // 0.1%
    chain: 'EVM'
  };

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    const amount = parseFloat(collateralAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid collateral amount');
      return;
    }

    const usdcBalance = getBalance('USDC');
    if (amount > usdcBalance) {
      alert('Insufficient USDC balance');
      return;
    }

    setIsProcessing(true);
    
    // Simulate transaction
    setTimeout(() => {
      const fee = amount * marketData.mintingFee;
      const netAmount = amount - fee;
      
      alert(`Minting successful!\n\nDeposited: ${amount} USDC\nFee: ${fee.toFixed(4)} USDC\nMinted: ${netAmount.toFixed(2)} PFRT + ${netAmount.toFixed(2)} NFRT`);
      setCollateralAmount('');
      setIsProcessing(false);
    }, 3000);
  };

  const getPfrtValue = () => {
    if (!collateralAmount) return 0;
    const amount = parseFloat(collateralAmount);
    const fee = amount * marketData.mintingFee;
    return amount - fee;
  };

  const getNfrtValue = () => {
    if (!collateralAmount) return 0;
    const amount = parseFloat(collateralAmount);
    const fee = amount * marketData.mintingFee;
    return amount - fee;
  };

  const getTotalFee = () => {
    if (!collateralAmount) return 0;
    const amount = parseFloat(collateralAmount);
    return amount * marketData.mintingFee;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Mint Conditional Tokens</CardTitle>
              <CardDescription>
                Deposit collateral to mint PFRT and NFRT tokens for {marketData.symbol}
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {marketData.chain}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Minting Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Epoch Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Current Epoch Status
              </CardTitle>
              <CardDescription>
                Market {marketData.symbol} - {marketData.nextEpoch} remaining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={marketData.epochProgress} className="w-full" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Progress:</span>
                  <span className="ml-2 font-medium">{marketData.epochProgress}%</span>
                </div>
                <div>
                  <span className="text-slate-600">Funding Rate:</span>
                  <span className={`ml-2 font-medium ${marketData.fundingRate >= 0 ? 'price-positive' : 'price-negative'}`}>
                    {(marketData.fundingRate * 100).toFixed(3)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Minting Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Coins className="h-5 w-5 mr-2 text-blue-600" />
                Mint Tokens
              </CardTitle>
              <CardDescription>
                Enter the amount of USDC to deposit as collateral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Collateral Input */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Collateral Amount (USDC)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="text-lg h-12"
                />
                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>Balance: {getBalance('USDC').toFixed(2)} USDC</span>
                  <button 
                    onClick={() => setCollateralAmount(getBalance('USDC').toString())}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Minting Preview */}
              {collateralAmount && (
                <div className="space-y-4">
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowDown className="h-6 w-6 text-slate-400" />
                  </div>

                  {/* Token Output */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-800">PFRT</span>
                        <span className="text-xs text-green-600">Positive Rate Token</span>
                      </div>
                      <p className="text-xl font-bold text-green-900">{getPfrtValue().toFixed(2)}</p>
                      <p className="text-sm text-green-700">Redeemable if funding rate ≥ 0%</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-red-800">NFRT</span>
                        <span className="text-xs text-red-600">Negative Rate Token</span>
                      </div>
                      <p className="text-xl font-bold text-red-900">{getNfrtValue().toFixed(2)}</p>
                      <p className="text-sm text-red-700">Redeemable if funding rate &lt; 0%</p>
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Collateral Deposited</span>
                        <span className="font-medium">{parseFloat(collateralAmount).toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Minting Fee ({(marketData.mintingFee * 100).toFixed(1)}%)</span>
                        <span className="font-medium">{getTotalFee().toFixed(4)} USDC</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium text-slate-900">Total Tokens Minted</span>
                        <span className="font-semibold">{getPfrtValue().toFixed(2)} Each</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mint Button */}
              <Button 
                onClick={handleMint}
                disabled={!isConnected || !collateralAmount || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
              >
                {isProcessing ? (
                  <>
                    <Zap className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : !isConnected ? (
                  'Connect Wallet'
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Mint Conditional Tokens
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 mb-1">How Minting Works</p>
                    <p className="text-slate-600">
                      Deposit USDC collateral to receive 1 PFRT + 1 NFRT per USDC. 
                      At epoch end, redeem winning tokens for collateral based on the funding rate outcome.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 mb-1">Risk Disclosure</p>
                    <p className="text-slate-600">
                      Conditional tokens carry risk. Only one token type will be redeemable at epoch end. 
                      Trading is available on secondary markets before expiration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Information */}
          <Card>
            <CardHeader>
              <CardTitle>Market Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Market</span>
                  <span className="font-medium text-slate-900">{marketData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Rate</span>
                  <span className={`font-medium ${marketData.fundingRate >= 0 ? 'price-positive' : 'price-negative'}`}>
                    {(marketData.fundingRate * 100).toFixed(3)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Next Epoch</span>
                  <span className="font-medium text-slate-900">{marketData.nextEpoch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Minting Fee</span>
                  <span className="font-medium text-slate-900">{(marketData.mintingFee * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Chain</span>
                  <span className="font-medium text-slate-900">{marketData.chain}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { step: 1, title: "Deposit Collateral", desc: "Lock USDC to mint tokens" },
                  { step: 2, title: "Receive Tokens", desc: "Get 1 PFRT + 1 NFRT per USDC" },
                  { step: 3, title: "Trade or Hold", desc: "Trade on AMM or hold until epoch end" },
                  { step: 4, title: "Redeem", desc: "Exchange winning tokens for collateral" }
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Your Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-blue-600" />
                Your Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  { token: 'USDC', balance: getBalance('USDC') },
                  { token: 'PFRT', balance: getBalance('PFRT') },
                  { token: 'NFRT', balance: getBalance('NFRT') },
                  { token: 'ZDLT', balance: getBalance('ZDLT') }
                ].map((item) => (
                  <div key={item.token} className="flex justify-between">
                    <span className="text-slate-600">{item.token}</span>
                    <span className="font-medium text-slate-900">{item.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MintPage;
