import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../lib/api';

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
  sendMoney: (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type'>) => Promise<boolean>;
  createCampaign: (data: Omit<Campaign, 'id' | 'creatorId' | 'creatorName' | 'raisedAmount' | 'createdAt' | 'contributions'>) => Promise<string | null>;
  contributeToCampaign: (campaignId: string, data: Omit<Contribution, 'id' | 'campaignId' | 'createdAt' | 'paymentStatus'>) => Promise<string | null>;
  getCampaignById: (id: string) => Campaign | null;
  calculateFee: (amount: number) => number;
  convertCurrency: (amount: number, fromCurrency: 'MZN' | 'RWF', toCurrency: 'MZN' | 'RWF') => number;
  updateTransactionStatus: (transactionId: string, status: Transaction['status'], paymentData?: any) => void;
  updateCampaignContribution: (contributionId: string, paymentData: any) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [exchangeRates, setExchangeRates] = useState({
    MZN_to_RWF: 18.5,
    RWF_to_MZN: 0.054
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load campaigns with error handling
        try {
          const campaignResult = await ApiService.getCampaigns();
          if (campaignResult.success) {
            setCampaigns(campaignResult.campaigns as Campaign[]);
          }
        } catch (error) {
          console.warn('Campaigns API failed:', error);
          // Continue with empty campaigns array
        }
        
        // Load exchange rates with fallback
        try {
          const ratesResult = await ApiService.getExchangeRates();
          if (ratesResult.success) {
            setExchangeRates({
              MZN_to_RWF: ratesResult.MZN_to_RWF,
              RWF_to_MZN: ratesResult.RWF_to_MZN
            });
          } else {
            // Fallback to default exchange rates
            console.warn('Using fallback exchange rates - backend not available');
            setExchangeRates({
              MZN_to_RWF: 18.5,
              RWF_to_MZN: 0.054
            });
          }
        } catch (error) {
          console.warn('Exchange rates API failed, using fallback rates:', error);
          // Fallback to default exchange rates
          setExchangeRates({
            MZN_to_RWF: 18.5,
            RWF_to_MZN: 0.054
          });
        }
        
        // Load user transactions if user is logged in
        if (user) {
          try {
            const transactionResult = await ApiService.getUserTransactions();
            if (transactionResult.success) {
              setTransactions(transactionResult.transactions);
            }
          } catch (error) {
            console.warn('User transactions API failed:', error);
            // Continue with empty transactions array
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Set fallback exchange rates even if other API calls fail
        setExchangeRates({
          MZN_to_RWF: 18.5,
          RWF_to_MZN: 0.054
        });
      }
    };

    loadData();
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

  const sendMoney = async (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await ApiService.createTransaction({
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        recipientPhone: data.recipientPhone,
        recipientCountry: data.recipientCountry,
        amount: data.amount,
        currency: data.currency,
        convertedCurrency: data.convertedCurrency,
        description: data.description,
        paymentMethod: data.paymentMethod
      });

      if (result.success) {
        // Reload transactions
        const transactionResult = await ApiService.getUserTransactions();
        if (transactionResult.success) {
          setTransactions(transactionResult.transactions);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Send money error:', error);
      return false;
    }
  };

  const createCampaign = async (data: Omit<Campaign, 'id' | 'creatorId' | 'creatorName' | 'raisedAmount' | 'createdAt' | 'contributions'>): Promise<string | null> => {
    if (!user) return null;

    try {
      const result = await ApiService.createCampaign(data);
      
      if (result.success) {
        // Reload campaigns
        const campaignResult = await ApiService.getCampaigns();
        if (campaignResult.success) {
          setCampaigns(campaignResult.campaigns as Campaign[]);
        }
        return result.campaignId;
      }
      
      return null;
    } catch (error) {
      console.error('Create campaign error:', error);
      return null;
    }
  };

  const contributeToCampaign = async (campaignId: string, data: Omit<Contribution, 'id' | 'campaignId' | 'createdAt' | 'paymentStatus'>): Promise<string | null> => {
    try {
      const result = await ApiService.contributeToCampaign(campaignId, data);
      
      if (result.success) {
        // Reload campaigns to update raised amounts
        const campaignResult = await ApiService.getCampaigns();
        if (campaignResult.success) {
          setCampaigns(campaignResult.campaigns as Campaign[]);
        }
        return result.contributionId;
      }
      
      return null;
    } catch (error) {
      console.error('Contribute to campaign error:', error);
      return null;
    }
  };
  const calculateFee = (amount: number): number => {
    if (amount >= 100 && amount < 1000) {
      return 150;
    }
    if (amount >= 1000) {
      return amount * 0.10;
    }
    return 0; // No fee for amounts below 100 (but minimum is 100)
  };

  const convertCurrency = (amount: number, fromCurrency: 'MZN' | 'RWF', toCurrency: 'MZN' | 'RWF'): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'MZN' && toCurrency === 'RWF') {
      return amount * exchangeRates.MZN_to_RWF;
    } else if (fromCurrency === 'RWF' && toCurrency === 'MZN') {
      return amount * exchangeRates.RWF_to_MZN;
    }
    
    return amount;
  };

  const getCampaignById = (id: string): Campaign | null => {
    return campaigns.find(campaign => campaign.id === id) || null;
  };

  const updateTransactionStatus = (transactionId: string, status: Transaction['status'], paymentData?: any) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === transactionId 
        ? { 
            ...transaction, 
            status, 
            paymentStatus: 'completed',
            completedAt: status === 'completed' ? new Date().toISOString() : transaction.completedAt,
            ...paymentData
          }
        : transaction
    ));
  };

  const updateCampaignContribution = async (contributionId: string, paymentData: any) => {
    try {
      // Update local state
      setCampaigns(prev => prev.map(campaign => ({
        ...campaign,
        contributions: campaign.contributions.map(contribution => 
          contribution.id === contributionId || contribution.paymentId === contributionId
            ? { 
                ...contribution, 
                paymentStatus: paymentData.status || 'completed',
                ...paymentData 
              }
            : contribution
        ),
        raisedAmount: paymentData.status === 'completed'
          ? campaign.raisedAmount + (campaign.contributions.find(c => c.id === contributionId || c.paymentId === contributionId)?.amount || 0)
          : campaign.raisedAmount
      })));
    } catch (error) {
      console.error('Update campaign contribution error:', error);
    }
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      campaigns,
      exchangeRates,
      sendMoney,
      createCampaign,
      contributeToCampaign,
      getCampaignById,
      calculateFee,
      convertCurrency,
      updateTransactionStatus,
      updateCampaignContribution
    }}>
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