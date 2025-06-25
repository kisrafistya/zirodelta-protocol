import React, { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface OracleSource {
  name: string;
  status: 'active' | 'degraded' | 'offline';
  lastUpdate: Date;
  confidence: number;
  latency: number;
  price?: number;
}

interface OracleHealthWidgetProps {
  sources: OracleSource[];
  aggregatedPrice: number;
  className?: string;
  showDetails?: boolean;
}

export const OracleHealthWidget: React.FC<OracleHealthWidgetProps> = ({
  sources,
  aggregatedPrice,
  className = '',
  showDetails = false
}) => {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    // Calculate overall health score
    const activeCount = sources.filter(s => s.status === 'active').length;
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    const score = (activeCount / sources.length) * 50 + (avgConfidence / 100) * 50;
    setHealthScore(Math.round(score));
  }, [sources]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-neon-green';
      case 'degraded': return 'text-yellow-400';
      case 'offline': return 'text-neon-red';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-neon-green';
    if (score >= 70) return 'text-yellow-400';
    return 'text-neon-red';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`card-cyber ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-neon-blue" />
            <div>
              <h3 className="text-lg font-semibold text-white">Oracle Health</h3>
              <p className="text-sm text-muted-foreground">Data source monitoring</p>
            </div>
          </div>
          
          {/* Health Score */}
          <div className="text-center">
            <div className={`text-2xl font-mono font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}%
            </div>
            <div className="text-xs text-muted-foreground">Health Score</div>
          </div>
        </div>

        {/* Aggregated Price */}
        <div className="bg-navy-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Aggregated Funding Rate</div>
              <div className="text-xl font-mono font-bold text-white">
                {(aggregatedPrice * 100).toFixed(4)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Sources Active</div>
              <div className="text-lg font-semibold text-neon-green">
                {sources.filter(s => s.status === 'active').length}/{sources.length}
              </div>
            </div>
          </div>
        </div>

        {/* Source Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Data Sources</h4>
            {showDetails && (
              <button className="text-xs text-neon-blue hover:text-cyan-400 transition-colors">
                View All Details
              </button>
            )}
          </div>

          {sources.map((source) => (
            <div key={source.name} className="space-y-2">
              {/* Source Summary */}
              <div 
                className="flex items-center justify-between p-3 bg-navy-800/30 rounded-lg hover:bg-navy-700/30 transition-colors cursor-pointer"
                onClick={() => setExpandedSource(expandedSource === source.name ? null : source.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={getStatusColor(source.status)}>
                    {getStatusIcon(source.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{source.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatTime(source.lastUpdate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">
                      {source.confidence}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  
                  {source.price && (
                    <div className="text-right">
                      <div className="text-sm font-mono text-white">
                        {(source.price * 100).toFixed(4)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Rate</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSource === source.name && (
                <div className="ml-6 p-4 bg-navy-900/50 rounded-lg border-l-2 border-neon-blue animate-fade-in">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="ml-2 font-mono text-white">{source.latency}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 font-medium ${getStatusColor(source.status)}`}>
                        {source.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Update:</span>
                      <span className="ml-2 font-mono text-white">
                        {source.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uptime:</span>
                      <span className="ml-2 font-mono text-neon-green">99.8%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-navy-600">
                    <button className="flex items-center space-x-2 text-xs text-neon-blue hover:text-cyan-400 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                      <span>Verify Data On-Chain</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Health Metrics */}
        <div className="mt-6 pt-6 border-t border-navy-600">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-mono font-bold text-neon-green">
                {sources.filter(s => s.status === 'active').length}
              </div>
              <div className="text-xs text-muted-foreground">Active Sources</div>
            </div>
            <div>
              <div className="text-lg font-mono font-bold text-white">
                {Math.round(sources.reduce((sum, s) => sum + s.latency, 0) / sources.length)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
            <div>
              <div className="text-lg font-mono font-bold text-neon-blue">
                99.9%
              </div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OracleHealthWidget;
