import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface FeeStructure {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  feeType: 'percentage' | 'fixed';
  feeValue: number;
  isActive: boolean;
  createdAt: string;
}

interface ExchangeRate {
  id: string;
  fromCurrency: 'MZN' | 'RWF';
  toCurrency: 'MZN' | 'RWF';
  rate: number;
  isActive: boolean;
  updatedAt: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile_money';
  feePercentage: number;
  isActive: boolean;
  provider?: string;
}

interface SystemUser {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: 'mozambique' | 'rwanda';
  status: 'active' | 'suspended';
  isEmailVerified: boolean;
  kycStatus: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  lastLogin?: string;
  totalTransactions: number;
  totalVolume: number;
}

interface PaymentTransaction {
  id: string;
  userId: string;
  type: 'send_money' | 'fundraising';
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  apiResponse?: any;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface ProfitReport {
  sendMoneyProfit: number;
  fundraisingProfit: number;
  totalProfit: number;
  period: string;
  transactions: number;
}

interface AdminContextType {
  users: SystemUser[];
  fees: FeeStructure[];
  exchangeRates: ExchangeRate[];
  paymentMethods: PaymentMethod[];
  paymentTransactions: PaymentTransaction[];
  profitReports: ProfitReport[];
  apiStatus: { [key: string]: boolean };
  
  // User Management
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => Promise<boolean>;
  updateKycStatus: (userId: string, status: 'approved' | 'pending' | 'rejected') => Promise<boolean>;
  
  // Fee Management
  createFee: (fee: Omit<FeeStructure, 'id' | 'createdAt'>) => Promise<boolean>;
  updateFee: (feeId: string, updates: Partial<FeeStructure>) => Promise<boolean>;
  toggleFeeStatus: (feeId: string) => Promise<boolean>;
  
  // Rate Management
  updateExchangeRate: (rateId: string, newRate: number) => Promise<boolean>;
  toggleRateStatus: (rateId: string) => Promise<boolean>;
  
  // Payment Management
  getFailedPayments: () => PaymentTransaction[];
  retryPayment: (transactionId: string) => Promise<boolean>;
  
  // API Management
  toggleApiStatus: (apiName: string) => Promise<boolean>;
  
  // Reports
  generateProfitReport: (period: string) => Promise<ProfitReport>;
  exportReport: (format: 'pdf' | 'excel', data: any) => Promise<string>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [profitReports, setProfitReports] = useState<ProfitReport[]>([]);
  const [apiStatus, setApiStatus] = useState<{ [key: string]: boolean }>({
    'payment_api': true,
    'sms_api': true,
    'email_api': true,
    'kyc_api': true
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      initializeAdminData();
    }
  }, [user]);

  const initializeAdminData = () => {
    // Initialize mock data
    setUsers([
      {
        id: 'user-1',
        accountNumber: 'UMP001234567',
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@example.com',
        phone: '+258841234567',
        country: 'mozambique',
        status: 'active',
        isEmailVerified: true,
        kycStatus: 'approved',
        createdAt: '2024-01-15T10:00:00Z',
        lastLogin: '2024-01-25T14:30:00Z',
        totalTransactions: 15,
        totalVolume: 45000
      },
      {
        id: 'user-2',
        accountNumber: 'UMP001234568',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@example.com',
        phone: '+250781234567',
        country: 'rwanda',
        status: 'active',
        isEmailVerified: false,
        kycStatus: 'pending',
        createdAt: '2024-01-20T08:00:00Z',
        totalTransactions: 3,
        totalVolume: 8500
      }
    ]);

    setFees([
      {
        id: 'fee-1',
        name: 'Standard Transfer Fee',
        minAmount: 100,
        maxAmount: 999,
        feeType: 'fixed',
        feeValue: 150,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'fee-2',
        name: 'High Value Transfer Fee',
        minAmount: 1000,
        maxAmount: 999999,
        feeType: 'percentage',
        feeValue: 10,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ]);

    setExchangeRates([
      {
        id: 'rate-1',
        fromCurrency: 'MZN',
        toCurrency: 'RWF',
        rate: 18.5,
        isActive: true,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rate-2',
        fromCurrency: 'RWF',
        toCurrency: 'MZN',
        rate: 0.054,
        isActive: true,
        updatedAt: new Date().toISOString()
      }
    ]);

    setPaymentMethods([
      {
        id: 'pm-1',
        name: 'Visa/Mastercard',
        type: 'card',
        feePercentage: 7,
        isActive: true
      },
      {
        id: 'pm-2',
        name: 'M-Pesa',
        type: 'mobile_money',
        feePercentage: 10,
        isActive: true,
        provider: 'Vodacom'
      },
      {
        id: 'pm-3',
        name: 'eMala',
        type: 'mobile_money',
        feePercentage: 10,
        isActive: true,
        provider: 'mCel'
      }
    ]);

    setPaymentTransactions([
      {
        id: 'pt-1',
        userId: 'user-1',
        type: 'send_money',
        amount: 1000,
        currency: 'MZN',
        paymentMethod: 'M-Pesa',
        status: 'completed',
        createdAt: '2024-01-25T10:00:00Z',
        completedAt: '2024-01-25T10:02:00Z'
      },
      {
        id: 'pt-2',
        userId: 'user-2',
        type: 'fundraising',
        amount: 500,
        currency: 'RWF',
        paymentMethod: 'Visa',
        status: 'failed',
        createdAt: '2024-01-25T11:00:00Z',
        failureReason: 'Insufficient funds'
      }
    ]);
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended'): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateKycStatus = async (userId: string, status: 'approved' | 'pending' | 'rejected'): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, kycStatus: status } : user
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const createFee = async (fee: Omit<FeeStructure, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newFee: FeeStructure = {
        ...fee,
        id: `fee-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setFees(prev => [newFee, ...prev]);
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateFee = async (feeId: string, updates: Partial<FeeStructure>): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFees(prev => prev.map(fee => 
        fee.id === feeId ? { ...fee, ...updates } : fee
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleFeeStatus = async (feeId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFees(prev => prev.map(fee => 
        fee.id === feeId ? { ...fee, isActive: !fee.isActive } : fee
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateExchangeRate = async (rateId: string, newRate: number): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExchangeRates(prev => prev.map(rate => 
        rate.id === rateId ? { ...rate, rate: newRate, updatedAt: new Date().toISOString() } : rate
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleRateStatus = async (rateId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExchangeRates(prev => prev.map(rate => 
        rate.id === rateId ? { ...rate, isActive: !rate.isActive } : rate
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const getFailedPayments = (): PaymentTransaction[] => {
    return paymentTransactions.filter(t => t.status === 'failed');
  };

  const retryPayment = async (transactionId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPaymentTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
      ));
      return true;
    } catch (error) {
      return false;
    }
  };

  const toggleApiStatus = async (apiName: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setApiStatus(prev => ({
        ...prev,
        [apiName]: !prev[apiName]
      }));
      return true;
    } catch (error) {
      return false;
    }
  };

  const generateProfitReport = async (period: string): Promise<ProfitReport> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sendMoneyProfit = paymentTransactions
      .filter(t => t.type === 'send_money' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount * 0.1), 0);
    
    const fundraisingProfit = paymentTransactions
      .filter(t => t.type === 'fundraising' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount * 0.1), 0);

    const report: ProfitReport = {
      sendMoneyProfit,
      fundraisingProfit,
      totalProfit: sendMoneyProfit + fundraisingProfit,
      period,
      transactions: paymentTransactions.filter(t => t.status === 'completed').length
    };

    setProfitReports(prev => [report, ...prev]);
    return report;
  };

  const exportReport = async (format: 'pdf' | 'excel'): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `report_${Date.now()}.${format}`;
  };

  return (
    <AdminContext.Provider value={{
      users,
      fees,
      exchangeRates,
      paymentMethods,
      paymentTransactions,
      profitReports,
      apiStatus,
      updateUserStatus,
      updateKycStatus,
      createFee,
      updateFee,
      toggleFeeStatus,
      updateExchangeRate,
      toggleRateStatus,
      getFailedPayments,
      retryPayment,
      toggleApiStatus,
      generateProfitReport,
      exportReport
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}