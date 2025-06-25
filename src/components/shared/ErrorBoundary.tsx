import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-400 mr-2" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                An unexpected error occurred. This might be a temporary issue.
              </p>
              
              {this.state.error && (
                <details className="text-sm">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                    Error Details
                  </summary>
                  <pre className="bg-gray-900 p-3 rounded text-red-300 text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex space-x-3">
                <Button 
                  onClick={this.handleReset}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Error display component for specific errors
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  className 
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Card className={`bg-red-500/10 border-red-500/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{errorMessage}</p>
            {onRetry && (
              <Button 
                onClick={onRetry}
                size="sm"
                className="mt-2 bg-red-600 hover:bg-red-700 text-white"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  return (
    <ErrorDisplay 
      error="Network error. Please check your connection and try again."
      onRetry={onRetry}
    />
  );
};

// Wallet error component
interface WalletErrorProps {
  error: string;
  onConnect?: () => void;
}

export const WalletError: React.FC<WalletErrorProps> = ({ error, onConnect }) => {
  return (
    <Card className="bg-amber-500/10 border-amber-500/20">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-amber-300 text-sm">{error}</p>
            {onConnect && (
              <Button 
                onClick={onConnect}
                size="sm"
                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
