import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../lib/api';

// Define interfaces at the top level for better organization
export interface Transaction {
  id: string;
  senderId: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  recipientCountry: 'mozambique' | 'rwanda';
  amount: number;
  currency: 'MZN' | 'RWF';
  convertedAmount: number;
  convertedCurrency: 'MZN' | 'RWF';
  exchangeRate: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'send' | 'receive';
  createdAt: string;
  completedAt?: string;
  reference: string;
  description?: string;
  paymentId?: string;
  paymentMethod?: string;
  isLocal?: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  currency: 'MZN' | 'RWF';
  creatorId: string;
  creatorName: string;
  imageUrl?: string;
  isActive: boolean;
  endDate?: string;
  createdAt: string;
  contributions: Contribution[];
}

export interface Contribution {
  id: string;
  campaignId: string;
  contributorName: string;
  contributorEmail?: string;
  contributorPhone: string;
  amount: number;
  currency: 'MZN' | 'RWF';
  isAnonymous: boolean;
  message?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  createdAt: string;
  paymentId?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  campaigns: Campaign[];
  exchangeRates: { MZN_to_RWF: number; RWF_to_MZN: number };
  MZN_to_RWF: number;
  RWF_to_MZN: number;
  loading: boolean;
  error: string;
  sendMoney: (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type' | 'convertedAmount' | 'convertedCurrency' | 'exchangeRate' | 'fee' | 'totalAmount' | 'isLocal'>) => Promise<boolean>;
  createCampaign: (data: Omit<Campaign, 'id' | 'creatorId' | 'creatorName' | 'raisedAmount' | 'createdAt' | 'contributions'>) => Promise<string | null>;
  contributeToCampaign: (campaignId: string, data: Omit<Contribution, 'id' | 'campaignId' | 'createdAt' | 'paymentStatus'>) => Promise<string | null>;
  getCampaignById: (id: string) => Campaign | null;
  calculateFee: (amount: number) => number;
  convertCurrency: (amount: number, fromCurrency: 'MZN' | 'RWF', toCurrency: 'MZN' | 'RWF') => number;
  updateTransactionStatus: (transactionId: string, status: Transaction['status'], paymentData?: { paymentId?: string; paymentMethod?: string }) => void;
  updateCampaignContribution: (contributionId: string, paymentData: { status: 'completed' | 'failed'; paymentId?: string }) => Promise<void>;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [exchangeRates, setExchangeRates] = useState({
    MZN_to_RWF: 18.5,
    RWF_to_MZN: 0.054
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      try {
        // Load campaigns with error handling
        try {
          const campaignResult = await ApiService.getCampaigns();
          if (isMounted && campaignResult.success) {
            setCampaigns(campaignResult.campaigns as Campaign[]);
          }
        } catch (error) {
          console.warn('Campaigns API failed, using empty campaigns list:', error);
          if (isMounted) {
            setCampaigns([]);
          }
        }
        
        // Load exchange rates with fallback
        try {
          const ratesResult = await ApiService.getExchangeRates();
          if (isMounted) {
            setExchangeRates({
              MZN_to_RWF: ratesResult.MZN_to_RWF || 18.5,
              RWF_to_MZN: ratesResult.RWF_to_MZN || 0.054
            });
            
            if (ratesResult.isFallback) {
              console.warn('Using fallback exchange rates');
            }
          }
        } catch (error) {
          console.warn('Exchange rates API failed, using fallback rates:', error);
          if (isMounted) {
            setExchangeRates({
              MZN_to_RWF: 18.5,
              RWF_to_MZN: 0.054
            });
          }
        }
        
        // Load user transactions if user is logged in
        if (user) {
          try {
            const transactionResult = await ApiService.getUserTransactions();
            if (isMounted && transactionResult.success) {
              setTransactions(transactionResult.transactions || []);
            }
          } catch (error) {
            console.warn('User transactions API failed, using empty transactions list:', error);
            if (isMounted) {
              setTransactions([]);
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error in loadData:', error);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    // Load user transactions when user changes
    const loadUserTransactions = async () => {
      if (user) {
        try {
          const result = await ApiService.getUserTransactions();
          if (result.success) {
            setTransactions(result.transactions);
          }
        } catch (error) {
          console.warn('Error loading user transactions:', error);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    };

    loadUserTransactions();
  }, [user]);

  // Calculate fee based on amount
  const calculateFee = (amount: number): number => {
    // 10% fee
    return amount * 0.10;
  };

  // Convert between currencies
  const convertCurrency = (
    amount: number,
    fromCurrency: 'MZN' | 'RWF',
    toCurrency: 'MZN' | 'RWF'
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'MZN' && toCurrency === 'RWF') {
      return amount * exchangeRates.MZN_to_RWF;
    } else {
      return amount * exchangeRates.RWF_to_MZN;
    }
  };

  // Update transaction status
  const updateTransactionStatus = (
    transactionId: string, 
    status: Transaction['status'], 
    paymentData?: { paymentId?: string; paymentMethod?: string }
  ) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === transactionId 
          ? { 
              ...tx, 
              status,
              ...(paymentData?.paymentId && { paymentId: paymentData.paymentId }),
              ...(paymentData?.paymentMethod && { paymentMethod: paymentData.paymentMethod }),
              ...(status === 'completed' && !tx.completedAt 
                ? { completedAt: new Date().toISOString() } 
                : {})
            } 
          : tx
      )
    );
  };

  // Get campaign by ID
  const getCampaignById = (id: string): Campaign | null => {
    return campaigns.find(campaign => campaign.id === id) || null;
  };

  // Create campaign
  const createCampaign = async (data: Omit<Campaign, 'id' | 'creatorId' | 'creatorName' | 'raisedAmount' | 'createdAt' | 'contributions'>): Promise<string | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const result = await ApiService.createCampaign({
        ...data,
        creatorId: user.id,
        creatorName: `${user.firstName} ${user.lastName}`,
        raisedAmount: 0,
        contributions: []
      });

      if (result.success) {
        const newCampaign: Campaign = {
          ...data,
          id: result.campaignId,
          creatorId: user.id,
          creatorName: `${user.firstName} ${user.lastName}`,
          raisedAmount: 0,
          createdAt: new Date().toISOString(),
          contributions: []
        };

        setCampaigns(prev => [newCampaign, ...prev]);
        return result.campaignId;
      }
      return null;
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to create campaign');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Contribute to campaign
  const contributeToCampaign = async (
    campaignId: string, 
    data: Omit<Contribution, 'id' | 'campaignId' | 'createdAt' | 'paymentStatus'>
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const result = await ApiService.contributeToCampaign(campaignId, data);

      if (result.success) {
        const newContribution: Contribution = {
          ...data,
          id: result.contributionId,
          campaignId,
          paymentStatus: 'completed',
          createdAt: new Date().toISOString()
        };

        // Update campaign's raised amount
        setCampaigns(prev => 
          prev.map(campaign => {
            if (campaign.id === campaignId) {
              return {
                ...campaign,
                raisedAmount: campaign.raisedAmount + data.amount,
                contributions: [...(campaign.contributions || []), newContribution]
              };
            }
            return campaign;
          })
        );

        return result.contributionId;
      }
      return null;
    } catch (error) {
      console.error('Error contributing to campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to contribute to campaign');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update campaign contribution
  const updateCampaignContribution = async (contributionId: string, paymentData: { status: 'completed' | 'failed'; paymentId?: string }) => {
    setCampaigns(prev => 
      prev.map(campaign => ({
        ...campaign,
        contributions: campaign.contributions.map(contribution => 
          contribution.id === contributionId 
            ? { 
                ...contribution, 
                paymentStatus: paymentData.status,
                ...(paymentData.paymentId && { paymentId: paymentData.paymentId })
              } 
            : contribution
        ),
        raisedAmount: paymentData.status === 'completed'
          ? campaign.raisedAmount + (campaign.contributions.find(c => c.id === contributionId)?.amount || 0)
          : campaign.raisedAmount
      })));
  };

  // Send money function
  const sendMoney = async (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type' | 'convertedAmount' | 'convertedCurrency' | 'exchangeRate' | 'fee' | 'totalAmount' | 'isLocal'>) => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate fee and totals
      const amount = Number(data.amount);
      const fee = calculateFee(amount);
      const totalAmount = amount + fee;
      
      // Create transaction object
      const transactionData = {
        ...data,
        amount,
        fee,
        totalAmount,
        convertedAmount: amount, // Will be updated by the backend
        convertedCurrency: data.currency, // Will be updated by the backend
        exchangeRate: data.currency === 'MZN' ? exchangeRates.MZN_to_RWF : exchangeRates.RWF_to_MZN,
        senderId: user?.id || '',
        reference: 'TXN-' + Date.now(),
        status: 'pending' as const,
        type: 'send' as const,
        createdAt: new Date().toISOString(),
        paymentId: '',
        paymentMethod: ''
      };
      
      try {
        // Try to save to backend
        const result = await ApiService.createTransaction(transactionData);
        
        if (result.success) {
          // Add to local state with transaction ID from backend if available
          const newTransaction: Transaction = {
            ...transactionData,
            id: result.transactionId || `local-txn-${Date.now()}`,
            status: 'processing' // Mark as processing until we get confirmation
          };
          
          setTransactions(prev => [newTransaction, ...prev]);
          return true;
        } else {
          throw new Error(result.error || 'Failed to create transaction');
        }
      } catch (apiError) {
        console.error('API error when creating transaction, saving locally:', apiError);
        
        // Save transaction locally if API fails
        const localTransaction: Transaction = {
          ...transactionData,
          id: `local-txn-${Date.now()}`,
          status: 'pending',
          isLocal: true
        };
        
        setTransactions(prev => [localTransaction, ...prev]);
        
        // Show warning to user
        setError('Transaction saved locally. Please check your internet connection and sync later.');
        return true; // Still return true since we saved it locally
      }
    } catch (error) {
      console.error('Error in sendMoney:', error);
      setError(error instanceof Error ? error.message : 'Failed to send money');
      return false;
    } finally {
      setLoading(false);
    }
  };


  const contextValue: TransactionContextType = {
    transactions,
    campaigns,
    exchangeRates,
    MZN_to_RWF: exchangeRates.MZN_to_RWF,
    RWF_to_MZN: exchangeRates.RWF_to_MZN,
    loading,
    error,
    sendMoney: async (data) => {
      try {
        setLoading(true);
        setError('');
        
        // Calculate fee and totals
        const amount = Number(data.amount);
        const fee = calculateFee(amount);
        const totalAmount = amount + fee;
        
        // Create transaction object
        const transactionData = {
          ...data,
          amount,
          fee,
          totalAmount,
          convertedAmount: amount, // Will be updated by the backend
          convertedCurrency: data.currency, // Will be updated by the backend
          exchangeRate: data.currency === 'MZN' ? exchangeRates.MZN_to_RWF : exchangeRates.RWF_to_MZN,
          senderId: user?.id || '',
          reference: 'TXN-' + Date.now(),
          status: 'pending' as const,
          type: 'send' as const,
          createdAt: new Date().toISOString(),
          paymentId: '',
          paymentMethod: ''
        };
        
        try {
          // Try to save to backend
          const result = await ApiService.createTransaction(transactionData);
          
          if (result.success) {
            // Add to local state with transaction ID from backend if available
            const newTransaction: Transaction = {
              ...transactionData,
              id: result.transactionId || `local-txn-${Date.now()}`,
              status: 'processing' // Mark as processing until we get confirmation
            };
            
            setTransactions(prev => [newTransaction, ...prev]);
            return true;
          } else {
            throw new Error(result.error || 'Failed to create transaction');
          }
        } catch (apiError) {
          console.error('API error when creating transaction, saving locally:', apiError);
          
          // Save transaction locally if API fails
          const localTransaction: Transaction = {
            ...transactionData,
            id: `local-txn-${Date.now()}`,
            status: 'pending',
            isLocal: true
          };
          
          setTransactions(prev => [localTransaction, ...prev]);
          
          // Show warning to user
          setError('Transaction saved locally. Please check your internet connection and sync later.');
          return true; // Still return true since we saved it locally
        }
      } catch (error) {
        console.error('Error in sendMoney:', error);
        setError(error instanceof Error ? error.message : 'Failed to send money');
        return false;
      } finally {
        setLoading(false);
      }
    },
    createCampaign,
    contributeToCampaign,
    getCampaignById,
    calculateFee,
    convertCurrency,
    updateTransactionStatus,
    updateCampaignContribution,
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}