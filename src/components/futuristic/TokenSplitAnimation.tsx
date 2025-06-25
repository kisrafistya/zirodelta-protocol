import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface TokenSplitAnimationProps {
  collateralAmount: number;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
}

export const TokenSplitAnimation: React.FC<TokenSplitAnimationProps> = ({
  collateralAmount,
  isAnimating = false,
  onAnimationComplete,
  className = ''
}) => {
  const [stage, setStage] = useState<'initial' | 'splitting' | 'complete'>('initial');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isAnimating) {
      // Generate particles for animation
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.1
      }));
      setParticles(newParticles);
      
      // Animation sequence
      setTimeout(() => setStage('splitting'), 500);
      setTimeout(() => {
        setStage('complete');
        onAnimationComplete?.();
      }, 2000);
    } else {
      setStage('initial');
    }
  }, [isAnimating, onAnimationComplete]);

  return (
    <div className={`relative w-full h-64 flex items-center justify-center ${className}`}>
      {/* Background Effect */}
      <div className="absolute inset-0 neural-network opacity-30" />
      
      {/* Particles */}
      {stage === 'splitting' && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-neon-blue rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            boxShadow: '0 0 10px rgba(0, 209, 255, 0.8)'
          }}
        />
      ))}

      {/* Main Animation */}
      <div className="relative z-10 flex items-center justify-center space-x-8">
        {/* USDC Collateral */}
        <div className={`
          transition-all duration-1000 ease-out
          ${stage === 'splitting' ? 'transform scale-110 animate-glow' : ''}
          ${stage === 'complete' ? 'transform scale-90 opacity-60' : ''}
        `}>
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-cyber">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="text-center">
                <div className="text-sm font-mono font-bold text-white">
                  ${collateralAmount.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">USDC</div>
              </div>
            </div>
            
            {/* Energy rings during splitting */}
            {stage === 'splitting' && (
              <>
                <div className="absolute inset-0 border-2 border-neon-blue rounded-full animate-ping" />
                <div className="absolute inset-0 border border-neon-blue/50 rounded-full animate-pulse" 
                     style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>
        </div>

        {/* Arrow/Split Effect */}
        <div className={`
          transition-all duration-500
          ${stage === 'initial' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
        `}>
          <div className="relative">
            <div className="w-16 h-1 bg-gradient-to-r from-neon-blue via-purple-500 to-neon-blue animate-glow" />
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <div className="w-0 h-0 border-l-4 border-l-neon-blue border-y-2 border-y-transparent" />
            </div>
            
            {/* Energy pulse */}
            {stage === 'splitting' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
            )}
          </div>
        </div>

        {/* Output Tokens Container */}
        <div className="flex flex-col space-y-4">
          {/* PFRT Token */}
          <div className={`
            transition-all duration-1000 ease-out
            ${stage === 'initial' ? 'opacity-0 transform translate-x-20 scale-0' : ''}
            ${stage === 'splitting' ? 'opacity-70 transform translate-x-10 scale-75' : ''}
            ${stage === 'complete' ? 'opacity-100 transform translate-x-0 scale-100 animate-bounce-in' : ''}
          `}>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-emerald-500 rounded-full flex items-center justify-center shadow-neon-green">
                <TrendingUp className="h-8 w-8 text-navy-900" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-neon-green">
                    1 PFRT
                  </div>
                </div>
              </div>
              
              {stage === 'complete' && (
                <div className="absolute -inset-2 border border-neon-green/30 rounded-full animate-ping" />
              )}
            </div>
          </div>

          {/* NFRT Token */}
          <div className={`
            transition-all duration-1000 ease-out
            ${stage === 'initial' ? 'opacity-0 transform translate-x-20 scale-0' : ''}
            ${stage === 'splitting' ? 'opacity-70 transform translate-x-10 scale-75' : ''}
            ${stage === 'complete' ? 'opacity-100 transform translate-x-0 scale-100 animate-bounce-in' : ''}
          `} style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-red to-red-500 rounded-full flex items-center justify-center shadow-neon-red">
                <TrendingDown className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-neon-red">
                    1 NFRT
                  </div>
                </div>
              </div>
              
              {stage === 'complete' && (
                <div className="absolute -inset-2 border border-neon-red/30 rounded-full animate-ping" 
                     style={{ animationDelay: '0.2s' }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Equation */}
      {stage === 'complete' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-fade-in">
          <div className="text-center">
            <div className="text-sm text-muted-foreground font-mono">
              Value(PFRT) + Value(NFRT) = ${collateralAmount.toFixed(2)} USDC
            </div>
            <div className="text-xs text-neon-blue mt-1">
              Conservation of Value Guaranteed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSplitAnimation;
