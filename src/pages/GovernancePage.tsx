import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { 
  Vote,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Coins,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';

const GovernancePage: React.FC = () => {
  const { isConnected, getBalance } = useWallet();
  const [selectedTab, setSelectedTab] = useState('proposals');

  // Mock governance data
  const governanceStats = {
    totalProposals: 12,
    activeProposals: 3,
    totalVoters: 1847,
    totalZdltStaked: 12450000,
    votingPower: getBalance('ZDLT'),
    participationRate: 73.2
  };

  const proposals = [
    {
      id: 1,
      title: 'Increase Minting Fee to 0.2%',
      description: 'Proposal to increase the minting fee from 0.1% to 0.2% to better align with market standards and improve protocol sustainability.',
      status: 'active',
      type: 'parameter',
      proposer: '0x1234...5678',
      created: '2024-01-15',
      votingEnds: '2024-01-22',
      forVotes: 8500000,
      againstVotes: 2300000,
      abstainVotes: 450000,
      totalVotes: 11250000,
      quorum: 10000000,
      threshold: 0.6
    },
    {
      id: 2,
      title: 'Add LINK-PERP Market',
      description: 'Proposal to add a new conditional token market for Chainlink (LINK) perpetual funding rates.',
      status: 'active',
      type: 'addition',
      proposer: '0x2345...6789',
      created: '2024-01-10',
      votingEnds: '2024-01-20',
      forVotes: 6800000,
      againstVotes: 4200000,
      abstainVotes: 300000,
      totalVotes: 11300000,
      quorum: 10000000,
      threshold: 0.6
    },
    {
      id: 3,
      title: 'Protocol Upgrade v2.1',
      description: 'Major protocol upgrade to improve gas efficiency and add multi-chain support for Polygon and Arbitrum.',
      status: 'pending',
      type: 'upgrade',
      proposer: '0x3456...7890',
      created: '2024-01-20',
      votingEnds: '2024-01-27',
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
      quorum: 10000000,
      threshold: 0.7
    },
    {
      id: 4,
      title: 'Reduce Epoch Duration to 12 Hours',
      description: 'Proposal to reduce the default epoch duration from 24 hours to 12 hours for faster market cycles.',
      status: 'passed',
      type: 'parameter',
      proposer: '0x4567...8901',
      created: '2024-01-01',
      votingEnds: '2024-01-08',
      forVotes: 9200000,
      againstVotes: 1800000,
      abstainVotes: 200000,
      totalVotes: 11200000,
      quorum: 10000000,
      threshold: 0.6
    }
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}K`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'parameter':
        return 'bg-purple-100 text-purple-800';
      case 'addition':
        return 'bg-green-100 text-green-800';
      case 'upgrade':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getVotingPowerPercentage = (votes: number, total: number) => {
    return total > 0 ? (votes / total * 100).toFixed(1) : '0';
  };

  const handleVote = (proposalId: number, voteType: 'for' | 'against' | 'abstain') => {
    if (!isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }
    alert(`Vote ${voteType} submitted for proposal ${proposalId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Governance Portal</CardTitle>
              <CardDescription>
                Participate in protocol governance and shape the future of ZiroDelta
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">
                ZDLT Required
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Proposals</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {governanceStats.totalProposals}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {governanceStats.activeProposals} active
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Vote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Voters</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {governanceStats.totalVoters.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {governanceStats.participationRate}% participation
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">ZDLT Staked</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(governanceStats.totalZdltStaked)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  In governance
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Coins className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Your Voting Power</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(governanceStats.votingPower)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  ZDLT tokens
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          <div className="space-y-6">
            {proposals.filter(p => p.status === 'active' || p.status === 'pending').map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg">{proposal.title}</CardTitle>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        <Badge className={getTypeColor(proposal.type)}>
                          {proposal.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {proposal.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Proposal Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Proposer</p>
                      <p className="font-medium">{proposal.proposer}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Created</p>
                      <p className="font-medium">{formatDate(proposal.created)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Voting Ends</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(proposal.votingEnds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Quorum</p>
                      <p className="font-medium">{formatCurrency(proposal.quorum)} ZDLT</p>
                    </div>
                  </div>

                  {/* Voting Results */}
                  {proposal.status === 'active' && proposal.totalVotes > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Voting Progress</span>
                        <span className="font-medium">
                          {formatCurrency(proposal.totalVotes)} / {formatCurrency(proposal.quorum)} 
                          ({getVotingPowerPercentage(proposal.totalVotes, proposal.quorum)}%)
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">For</span>
                          <span className="font-medium">
                            {formatCurrency(proposal.forVotes)} ({getVotingPowerPercentage(proposal.forVotes, proposal.totalVotes)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${getVotingPowerPercentage(proposal.forVotes, proposal.totalVotes)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Against</span>
                          <span className="font-medium">
                            {formatCurrency(proposal.againstVotes)} ({getVotingPowerPercentage(proposal.againstVotes, proposal.totalVotes)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${getVotingPowerPercentage(proposal.againstVotes, proposal.totalVotes)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Abstain</span>
                          <span className="font-medium">
                            {formatCurrency(proposal.abstainVotes)} ({getVotingPowerPercentage(proposal.abstainVotes, proposal.totalVotes)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-slate-400 h-2 rounded-full" 
                            style={{ width: `${getVotingPowerPercentage(proposal.abstainVotes, proposal.totalVotes)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voting Buttons */}
                  {proposal.status === 'active' && (
                    <div className="flex space-x-3 pt-4 border-t">
                      <Button 
                        onClick={() => handleVote(proposal.id, 'for')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!isConnected}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote For
                      </Button>
                      <Button 
                        onClick={() => handleVote(proposal.id, 'against')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={!isConnected}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Vote Against
                      </Button>
                      <Button 
                        onClick={() => handleVote(proposal.id, 'abstain')}
                        variant="outline"
                        disabled={!isConnected}
                      >
                        Abstain
                      </Button>
                    </div>
                  )}

                  {proposal.status === 'pending' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Voting has not started yet. Check back on {formatDate(proposal.votingEnds)}.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {proposals.filter(p => p.status === 'passed' || p.status === 'failed').map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{proposal.title}</h3>
                        <Badge className={getStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                        <Badge className={getTypeColor(proposal.type)}>
                          {proposal.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{proposal.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>Ended: {formatDate(proposal.votingEnds)}</span>
                        <span>•</span>
                        <span>Total Votes: {formatCurrency(proposal.totalVotes)}</span>
                        <span>•</span>
                        <span>
                          For: {getVotingPowerPercentage(proposal.forVotes, proposal.totalVotes)}% | 
                          Against: {getVotingPowerPercentage(proposal.againstVotes, proposal.totalVotes)}%
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-slate-900 mb-1">Governance Information</p>
              <p className="text-slate-600">
                ZDLT token holders can participate in governance by staking their tokens and voting on proposals. 
                Voting power is proportional to the amount of ZDLT staked. Proposals require a minimum quorum and 
                threshold to pass. Make sure to stay informed about active proposals and participate in shaping the protocol's future.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernancePage;
