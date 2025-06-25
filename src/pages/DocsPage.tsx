import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  BookOpen, 
  Code, 
  Shield, 
  Zap,
  Coins,
  BarChart3,
  Settings,
  Users,
  ArrowRight,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Lock,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

const DocsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('overview');

  const categories = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'concepts', label: 'Core Concepts', icon: Layers },
    { id: 'contracts', label: 'Smart Contracts', icon: Code },
    { id: 'tokenomics', label: 'Tokenomics', icon: Coins },
    { id: 'governance', label: 'Governance', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Reference', icon: GitBranch },
    { id: 'guides', label: 'Integration Guides', icon: Settings }
  ];

  const quickLinks = [
    { title: 'White Paper', url: '#', icon: FileText },
    { title: 'GitHub Repository', url: '#', icon: GitBranch },
    { title: 'Security Audit', url: '#', icon: Shield },
    { title: 'Economic Model', url: '#', icon: TrendingUp }
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">ZiroDelta Protocol</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">
          ZiroDelta is a revolutionary DeFi protocol that tokenizes funding rates through conditional tokens, 
          offering zero-liquidation risk and advanced trading capabilities across multiple blockchain networks.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Zero Liquidation Risk</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600">
                Conditional tokens eliminate liquidation risk entirely
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Multi-Chain Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600">
                Available on Ethereum, Polygon, and Solana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Advanced AMM</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600">
                Purpose-built for conditional token trading
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Funding Rate Tokenization</h4>
              <p className="text-sm text-slate-600">
                Convert funding rates into tradeable conditional tokens (PFRT/NFRT)
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Decentralized Governance</h4>
              <p className="text-sm text-slate-600">
                Community-driven protocol governance with ZDLT token holders
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-900">Emergency Mechanisms</h4>
              <p className="text-sm text-slate-600">
                Built-in circuit breakers and emergency pause functionality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConcepts = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Core Concepts</h2>
        <p className="text-slate-600 mb-6">
          Understanding the fundamental concepts behind ZiroDelta Protocol
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-blue-600" />
              <span>Conditional Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              ZiroDelta uses conditional tokens to represent different positions on funding rates:
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">PFRT</Badge>
                <div>
                  <p className="font-medium text-slate-900">Positive Funding Rate Token</p>
                  <p className="text-sm text-slate-600">
                    Represents a long position on funding rates. Profitable when funding rates are positive.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">NFRT</Badge>
                <div>
                  <p className="font-medium text-slate-900">Negative Funding Rate Token</p>
                  <p className="text-sm text-slate-600">
                    Represents a short position on funding rates. Profitable when funding rates are negative.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Epoch System</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              The protocol operates on an epoch-based system where:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>Each epoch has a predetermined duration</span>
              </li>
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>Tokens are minted and redeemed within epochs</span>
              </li>
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>Settlement occurs at the end of each epoch</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span>Collateral System</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              ZiroDelta uses USDC as collateral for minting conditional tokens:
            </p>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>1 USDC mints 1 PFRT + 1 NFRT</span>
              </li>
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>Redemption requires both PFRT and NFRT</span>
              </li>
              <li className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span>Collateral is locked until redemption</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContracts = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Smart Contracts</h2>
        <p className="text-slate-600 mb-6">
          ZiroDelta Protocol consists of multiple interconnected smart contracts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaMinting</CardTitle>
            <p className="text-sm text-slate-600">Core minting and redemption logic</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">mint(uint256 _collateralAmount)</code></li>
                  <li>• <code className="text-blue-600">redeem(uint256 _pfrtAmount, uint256 _nfrtAmount)</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Manages the creation and destruction of PFRT/NFRT tokens backed by USDC collateral
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaAMM</CardTitle>
            <p className="text-sm text-slate-600">Automated Market Maker for token trading</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">swap(address _tokenIn, uint256 _amountIn)</code></li>
                  <li>• <code className="text-blue-600">addLiquidity(uint256 _pfrtAmount, uint256 _nfrtAmount)</code></li>
                  <li>• <code className="text-blue-600">removeLiquidity(uint256 _pfrtAmount, uint256 _nfrtAmount)</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Purpose-built AMM designed for conditional token characteristics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaOracle</CardTitle>
            <p className="text-sm text-slate-600">Funding rate data provider</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">updateFundingRate()</code></li>
                  <li>• <code className="text-blue-600">emergencyUpdateFundingRate(uint256 _newFundingRate)</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Provides reliable funding rate data with emergency update capabilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaGovernance</CardTitle>
            <p className="text-sm text-slate-600">Decentralized governance system</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">propose(...)</code></li>
                  <li>• <code className="text-blue-600">vote(uint256 proposalId, uint8 support)</code></li>
                  <li>• <code className="text-blue-600">execute(uint256 proposalId)</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Manages ZDLT governance token and voting process with timelock integration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaEmergency</CardTitle>
            <p className="text-sm text-slate-600">Emergency pause mechanisms</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">pause()</code></li>
                  <li>• <code className="text-blue-600">unpause()</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Circuit breakers and emergency procedures with access control
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">ZiroDeltaEpochManager</CardTitle>
            <p className="text-sm text-slate-600">Epoch lifecycle management</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Functions:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <code className="text-blue-600">startNewEpoch()</code></li>
                  <li>• <code className="text-blue-600">settleEpoch()</code></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Purpose:</h4>
                <p className="text-sm text-slate-600">
                  Manages epoch transitions, settlements, and rollovers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTokenomics = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Tokenomics</h2>
        <p className="text-slate-600 mb-6">
          ZiroDelta Protocol features a three-token system designed for governance and conditional trading
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-600">PFRT</CardTitle>
              <Badge className="bg-green-100 text-green-800">Conditional</Badge>
            </div>
            <p className="text-sm text-slate-600">Positive Funding Rate Token</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Characteristics:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Represents long funding rate position</li>
                  <li>• Minted with USDC collateral</li>
                  <li>• Tradeable on ZiroDelta AMM</li>
                  <li>• Redeemable for settlement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Use Cases:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Hedge against positive funding rates</li>
                  <li>• Speculation on funding rate direction</li>
                  <li>• Arbitrage opportunities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-600">NFRT</CardTitle>
              <Badge className="bg-red-100 text-red-800">Conditional</Badge>
            </div>
            <p className="text-sm text-slate-600">Negative Funding Rate Token</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Characteristics:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Represents short funding rate position</li>
                  <li>• Minted with USDC collateral</li>
                  <li>• Tradeable on ZiroDelta AMM</li>
                  <li>• Redeemable for settlement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Use Cases:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Hedge against negative funding rates</li>
                  <li>• Speculation on funding rate direction</li>
                  <li>• Arbitrage opportunities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-600">ZDLT</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">Governance</Badge>
            </div>
            <p className="text-sm text-slate-600">ZiroDelta Governance Token</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-slate-900">Characteristics:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Protocol governance voting rights</li>
                  <li>• Proposal creation privileges</li>
                  <li>• Parameter adjustment authority</li>
                  <li>• Fee distribution rights</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Governance Powers:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Protocol parameter updates</li>
                  <li>• Contract upgrades</li>
                  <li>• Fee structure changes</li>
                  <li>• Emergency procedures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Economic Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Minting Mechanism</h4>
              <p className="text-slate-600 text-sm">
                Users deposit 1 USDC to mint 1 PFRT + 1 NFRT. This ensures the total value is always backed by collateral.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Settlement Process</h4>
              <p className="text-slate-600 text-sm">
                At epoch end, tokens are settled based on the actual funding rate. The winning token receives the majority of the collateral value.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Fee Structure</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Minting Fee: 0.1% of collateral amount</li>
                <li>• Trading Fee: 0.3% of trade volume</li>
                <li>• Governance Fee: 0.05% of protocol revenue</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Security</h2>
        <p className="text-slate-600 mb-6">
          ZiroDelta Protocol implements multiple layers of security measures and has undergone thorough auditing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-green-600">Mitigated Risks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Reentrancy Protection</h4>
                  <p className="text-sm text-slate-600">
                    All contracts use OpenZeppelin's nonReentrant modifier
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Integer Overflow</h4>
                  <p className="text-sm text-slate-600">
                    Solidity 0.8.20+ built-in overflow protection
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Access Control</h4>
                  <p className="text-sm text-slate-600">
                    Role-based permissions with OpenZeppelin AccessControl
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Emergency Pause</h4>
                  <p className="text-sm text-slate-600">
                    Circuit breakers can halt protocol operations
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-600">Ongoing Risks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Oracle Manipulation</h4>
                  <p className="text-sm text-slate-600">
                    Single oracle dependency - considering multi-oracle setup
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Flash Loan Attacks</h4>
                  <p className="text-sm text-slate-600">
                    AMM vulnerable to price manipulation via flash loans
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-slate-900">Cross-Chain Risks</h4>
                  <p className="text-sm text-slate-600">
                    Multi-chain deployment increases attack surface
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Multi-Oracle Integration</h4>
                <p className="text-sm text-slate-600">
                  Implement multiple oracle providers with Time-Weighted Average Price (TWAP) validation
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">TWAP Oracle for AMM</h4>
                <p className="text-sm text-slate-600">
                  Use TWAP oracle for AMM pricing to mitigate flash loan attack risks
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-900">Cross-Chain Security Review</h4>
                <p className="text-sm text-slate-600">
                  Comprehensive security audit of bridge mechanisms and cross-chain communication
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case 'overview':
        return renderOverview();
      case 'concepts':
        return renderConcepts();
      case 'contracts':
        return renderContracts();
      case 'tokenomics':
        return renderTokenomics();
      case 'security':
        return renderSecurity();
      case 'governance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Governance</h2>
            <p className="text-slate-600">
              Comprehensive governance documentation coming soon...
            </p>
          </div>
        );
      case 'api':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">API Reference</h2>
            <p className="text-slate-600">
              API documentation and integration guides coming soon...
            </p>
          </div>
        );
      case 'guides':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Integration Guides</h2>
            <p className="text-slate-600">
              Step-by-step integration guides coming soon...
            </p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Documentation</h1>
          <p className="text-slate-600">
            Comprehensive documentation for ZiroDelta Protocol
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {quickLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={index}
                        href={link.url}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.title}</span>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
