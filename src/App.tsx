import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/pages/HomePage';
import MarketsPage from '@/pages/MarketsPage';
import TradePage from '@/pages/TradePage';
import MintPage from '@/pages/MintPage';
import PortfolioPage from '@/pages/PortfolioPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import GovernancePage from '@/pages/GovernancePage';
import DocsPage from '@/pages/DocsPage';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LandingLayout from '@/components/layout/LandingLayout';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <Router>
            <Routes>
              {/* Landing Page */}
              <Route 
                path="/" 
                element={
                  <LandingLayout>
                    <HomePage />
                  </LandingLayout>
                } 
              />
              
              {/* Dashboard Pages */}
              <Route 
                path="/markets" 
                element={
                  <DashboardLayout>
                    <MarketsPage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/trade" 
                element={
                  <DashboardLayout>
                    <TradePage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/mint" 
                element={
                  <DashboardLayout>
                    <MintPage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/portfolio" 
                element={
                  <DashboardLayout>
                    <PortfolioPage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <DashboardLayout>
                    <AnalyticsPage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/governance" 
                element={
                  <DashboardLayout>
                    <GovernancePage />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/docs" 
                element={
                  <DashboardLayout>
                    <DocsPage />
                  </DashboardLayout>
                } 
              />
            </Routes>
            <Toaster />
          </Router>
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
