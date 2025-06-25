import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentGaugeProps {
  sentiment: number; // -100 to 100
  title?: string;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

export const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  sentiment,
  title = "Market Sentiment",
  subtitle,
  className = '',
  animated = true
}) => {
  const [displaySentiment, setDisplaySentiment] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplaySentiment(sentiment);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplaySentiment(sentiment);
    }
  }, [sentiment, animated]);

  const getSentimentColor = (value: number) => {
    if (value > 30) return 'neon-green';
    if (value > 10) return 'emerald-400';
    if (value > -10) return 'yellow-400';
    if (value > -30) return 'orange-400';
    return 'neon-red';
  };

  const getSentimentIcon = (value: number) => {
    if (value > 10) return <TrendingUp className="h-5 w-5" />;
    if (value < -10) return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getSentimentLabel = (value: number) => {
    if (value > 50) return 'Extremely Bullish';
    if (value > 30) return 'Very Bullish';
    if (value > 10) return 'Bullish';
    if (value > -10) return 'Neutral';
    if (value > -30) return 'Bearish';
    if (value > -50) return 'Very Bearish';
    return 'Extremely Bearish';
  };

  const normalizedValue = Math.max(-100, Math.min(100, displaySentiment));
  const gaugeRotation = (normalizedValue / 100) * 90; // -90 to +90 degrees
  const progressValue = ((normalizedValue + 100) / 200) * 100; // 0 to 100%
  const colorClass = getSentimentColor(normalizedValue);

  return (
    <div className={`card-cyber p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Circular Gauge */}
      <div className="relative w-48 h-24 mx-auto mb-6">
        <svg
          viewBox="0 0 200 100"
          className="w-full h-full"
        >
          {/* Background Arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="rgba(72, 101, 129, 0.3)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Progress Arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke={`rgba(${colorClass === 'neon-green' ? '0, 255, 153' : 
                           colorClass === 'neon-red' ? '255, 77, 77' : 
                           '255, 215, 0'}, 0.8)`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(progressValue / 100) * 251.2} 251.2`}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px rgba(${colorClass === 'neon-green' ? '0, 255, 153' : 
                                                   colorClass === 'neon-red' ? '255, 77, 77' : 
                                                   '255, 215, 0'}, 0.5))`
            }}
          />
          
          {/* Needle */}
          <g transform={`translate(100, 80) rotate(${gaugeRotation})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-60"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-transform duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))'
              }}
            />
            <circle
              cx="0"
              cy="0"
              r="4"
              fill="white"
              className="animate-glow"
            />
          </g>
        </svg>
      </div>

      {/* Sentiment Display */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <div className={`text-${colorClass}`}>
            {getSentimentIcon(normalizedValue)}
          </div>
          <span className={`text-2xl font-mono font-bold text-${colorClass}`}>
            {normalizedValue > 0 ? '+' : ''}{normalizedValue.toFixed(0)}
          </span>
        </div>
        
        <div className={`text-sm font-medium text-${colorClass}`}>
          {getSentimentLabel(normalizedValue)}
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-navy-600">
          <div className="text-center">
            <div className="text-neon-green font-mono font-semibold">
              {Math.max(0, Math.round(50 + normalizedValue / 2))}%
            </div>
            <div className="text-xs text-muted-foreground">PFRT Bias</div>
          </div>
          <div className="text-center">
            <div className="text-neon-red font-mono font-semibold">
              {Math.max(0, Math.round(50 - normalizedValue / 2))}%
            </div>
            <div className="text-xs text-muted-foreground">NFRT Bias</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentGauge;
