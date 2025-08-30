import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import DottedBackground from './components/ui/DottedBackground';

// Pages
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import CollectionView from './pages/CollectionView';
import Betting from './pages/Betting';
import GameZone from './pages/GameZone';
import GameDetail from './pages/GameDetail';
import Redeem from './pages/Redeem';
import WalletDashboard from './pages/WalletDashboard';
import WalletProfile from './pages/WalletProfile';
import NotFound from './pages/NotFound';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
                <Navbar />
                <main className="relative">
                  <DottedBackground />
                  <div className="relative z-10">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/marketplace/:collection/view" element={<CollectionView />} />
                      <Route path="/betting" element={<Betting />} />
                      <Route path="/gamezone" element={<GameZone />} />
                      <Route path="/gamezone/:gameSlug" element={<GameDetail />} />
                      <Route path="/redeem" element={<Redeem />} />
                      <Route path="/wallet/:walletAddress/dashboard" element={<WalletDashboard />} />
                      <Route path="/wallet/:walletAddress/profile" element={<WalletProfile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
                
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </SocketProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
