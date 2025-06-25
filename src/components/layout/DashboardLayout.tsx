import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Zap, 
  Coins, 
  Briefcase, 
  BarChart3, 
  Vote, 
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isConnected, address, disconnect, connect } = useWallet();

  const navigation = [
    { name: 'Markets', href: '/markets', icon: TrendingUp },
    { name: 'Trade', href: '/trade', icon: Zap },
    { name: 'Mint', href: '/mint', icon: Coins },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Governance', href: '/governance', icon: Vote },
    { name: 'Docs', href: '/docs', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    await connect('MetaMask');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-slate-900 font-semibold text-lg">ZiroDelta</span>
            <div className="text-sm text-slate-500">Protocol</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">
                  {formatAddress(address!)}
                </div>
                <div className="text-xs text-slate-500">Connected</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Connect Wallet
          </Button>
        )}
        
        <Link
          to="/"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Home className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-slate-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-slate-900">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-slate-600 hidden lg:block">
                  Manage your DeFi protocol interactions
                </p>
              </div>
            </div>
            
            {!isConnected && (
              <Button 
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white hidden lg:flex"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 