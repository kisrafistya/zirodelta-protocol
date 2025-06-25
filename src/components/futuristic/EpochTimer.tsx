import React, { useState, useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';

interface EpochTimerProps {
  endTime: Date;
  className?: string;
  compact?: boolean;
  onComplete?: () => void;
}

export const EpochTimer: React.FC<EpochTimerProps> = ({ 
  endTime, 
  className = '', 
  compact = false,
  onComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        onComplete?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  const formatTime = (time: number) => String(time).padStart(2, '0');

  const getUrgencyClass = () => {
    if (timeLeft.total < 300000) return 'border-neon-red shadow-neon-red animate-glow'; // < 5 min
    if (timeLeft.total < 900000) return 'border-neon-yellow shadow-neon-yellow'; // < 15 min
    return 'border-neon-blue shadow-neon-blue';
  };

  if (compact) {
    return (
      <div className={`epoch-timer ${getUrgencyClass()} ${className}`}>
        <div className="flex items-center space-x-2">
          <Timer className="h-4 w-4 text-neon-blue animate-spin-slow" />
          <span className="font-mono text-sm font-medium">
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-cyber p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-neon-blue" />
          <span className="text-sm font-medium text-muted-foreground">Next Epoch</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${getUrgencyClass().includes('red') ? 'bg-neon-red animate-glow' : 'bg-neon-blue'}`} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-neon-blue">
            {formatTime(timeLeft.hours)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-neon-blue">
            {formatTime(timeLeft.minutes)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-neon-blue animate-neon-pulse">
            {formatTime(timeLeft.seconds)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Seconds</div>
        </div>
      </div>

      <div className="progress-cyber h-2">
        <div 
          className="progress-bar h-full"
          style={{ 
            width: `${Math.max(0, Math.min(100, (timeLeft.total / (24 * 60 * 60 * 1000)) * 100))}%` 
          }}
        />
      </div>
    </div>
  );
};

export default EpochTimer;
