import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { TransactionProvider } from './contexts/TransactionContext';
import { AdminProvider } from './contexts/AdminContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import MobileNav from './components/Layout/MobileNav';
import Homepage from './pages/Homepage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import SendMoney from './pages/Transfer/SendMoney';
import TransactionHistory from './pages/Transfer/TransactionHistory';
import Fundraising from './pages/Fundraising/Fundraising';
import CreateCampaign from './pages/Fundraising/CreateCampaign';
import CampaignDetail from './pages/Fundraising/CampaignDetail';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import Menu from './pages/Menu/Menu';
import Settings from './pages/Settings/Settings';
import About from './pages/About/About';
import Security from './pages/Security/Security';
import Support from './pages/Support/Support';
import Help from './pages/Help/Help';
import Notifications from './pages/Notifications/Notifications';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService/TermsOfService';
import Compliance from './pages/Compliance/Compliance';
import ExchangeRates from './pages/ExchangeRates/ExchangeRates';

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

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" />;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/send-money" element={
            <ProtectedRoute>
              <SendMoney />
            </ProtectedRoute>
          } />
          
          <Route path="/transactions" element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/transaction-history" element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/fundraising" element={<Fundraising />} />
          
          <Route path="/create-campaign" element={
            <ProtectedRoute>
              <CreateCampaign />
            </ProtectedRoute>
          } />
          
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/success" element={<PaymentSuccess />} />
          
          <Route path="/menu" element={<Menu />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/security" element={<Security />} />
          <Route path="/support" element={<Support />} />
          <Route path="/help" element={<Help />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/exchange-rates" element={<ExchangeRates />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <TransactionProvider>
            <AppContent />
          </TransactionProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;