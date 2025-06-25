import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isConnected, connect } = useWallet();

  const handleConnect = async () => {
    await connect('MetaMask');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-slate-900 font-semibold text-lg">ZiroDelta</span>
                <div className="text-sm text-slate-500">Protocol</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/markets" 
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Markets
              </Link>
              <Link 
                to="/trade" 
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Trade
              </Link>
              <Link 
                to="/docs" 
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Docs
              </Link>
              
              {!isConnected ? (
                <Button 
                  onClick={handleConnect}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Connect Wallet
                </Button>
              ) : (
                <Link to="/portfolio">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-slate-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/markets"
                  className="block px-3 py-2 text-slate-600 hover:text-slate-900 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Markets
                </Link>
                <Link
                  to="/trade"
                  className="block px-3 py-2 text-slate-600 hover:text-slate-900 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Trade
                </Link>
                <Link
                  to="/docs"
                  className="block px-3 py-2 text-slate-600 hover:text-slate-900 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Docs
                </Link>
                <div className="px-3 py-2">
                  {!isConnected ? (
                    <Button 
                      onClick={handleConnect}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Connect Wallet
                    </Button>
                  ) : (
                    <Link to="/portfolio" className="block">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-900 font-semibold">ZiroDelta Protocol</span>
            </div>
            <div className="text-sm text-slate-500">
              © 2024 ZiroDelta Protocol. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout; 