import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className, 
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 
          className={cn(
            'animate-spin text-blue-600',
            sizeClasses[size]
          )} 
        />
        {text && (
          <p className="text-sm text-slate-600">{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;

// Enhanced loading component for transactions
interface TransactionLoadingProps {
  step: string;
  txHash?: string;
  chainType: 'EVM' | 'SVM';
}

export const TransactionLoading: React.FC<TransactionLoadingProps> = ({
  step,
  txHash,
  chainType
}) => {
  const explorerUrl = chainType === 'EVM' 
    ? `https://etherscan.io/tx/${txHash}`
    : `https://solscan.io/tx/${txHash}`;

  return (
    <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg">
      <div className="flex items-center space-x-4">
        <LoadingSpinner size="lg" />
        <div className="flex-1">
          <h3 className="text-white font-semibold">{step}</h3>
          {txHash && (
            <a 
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm underline"
            >
              View on {chainType === 'EVM' ? 'Etherscan' : 'Solscan'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for cards
interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn('bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6', className)}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="h-8 bg-gray-700 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-700 rounded w-20"></div>
          <div className="h-8 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};
