import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { TransactionProvider } from './contexts/TransactionContext';
import { AdminProvider } from './contexts/AdminContext';
import LayoutBase from './components/Layout/LayoutBase';
import Homepage from './pages/Homepage';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SendMoney from './pages/Transfer/SendMoney';
import Fundraising from './pages/Fundraising/Fundraising';
import CreateCampaign from './pages/Fundraising/CreateCampaign';
import Menu from './pages/Menu/Menu';
import TransactionHistory from './pages/Transfer/TransactionHistory';
import TransactionStatus from './pages/TransactionStatus/TransactionStatus';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import Services from './pages/Services/Services';
import Help from './pages/Help/Help';
import Support from './pages/Support/Support';
import Security from './pages/Security/Security';
import ExchangeRates from './pages/ExchangeRates/ExchangeRates';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import Compliance from './pages/Compliance/Compliance';
import About from './pages/About/About';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// Layout wrapper for routes that should include the BottomNav
const LayoutWithNav = () => (
  <LayoutBase withBottomNav={true}>
    <Outlet />
  </LayoutBase>
);

// Layout wrapper for routes that should NOT include the BottomNav
const LayoutWithoutNav = () => (
  <LayoutBase withBottomNav={false}>
    <Outlet />
  </LayoutBase>
);

function AppContent() {
  return (
    <Routes>
      {/* Public routes without BottomNav */}
      <Route element={<LayoutWithoutNav />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      {/* Protected routes with BottomNav */}
      <Route element={
        <ProtectedRoute>
          <LayoutWithNav />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Homepage />} />
        <Route path="/send-money" element={<SendMoney />} />
        <Route path="/send" element={<Navigate to="/send-money" replace />} />
        <Route path="/fundraising" element={<Fundraising />} />
        <Route path="/fundraise" element={<Navigate to="/fundraising" replace />} />
        <Route path="/create-campaign" element={<CreateCampaign />} />
        <Route path="/profile" element={<ProfilePage />}>
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/menu" element={<Menu />} />
        
        {/* Menu Item Routes */}
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/transaction/status" element={<TransactionStatus />} />
        <Route path="/exchange-rates" element={<ExchangeRates />} />
        <Route path="/help" element={<Help />} />
        <Route path="/support" element={<Support />} />
        <Route path="/security" element={<Security />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/settings" element={<Navigate to="/profile/settings" replace />} />
      </Route>
      
      {/* 404 - Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TransactionProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </TransactionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;