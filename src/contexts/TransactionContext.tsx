import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../lib/api';
import { calculateTransactionFee, generateTransactionReference } from './transactionUtils';
import { Transaction, Campaign, Contribution, TransactionContextType } from '../types/transaction';

// Define types for API responses
interface ApiCampaign {
  id?: string;
  title?: string;
  description?: string;
  goalAmount?: number;
  targetAmount?: number;
  currency?: string;
  creatorId?: string;
  creatorName?: string;
  raisedAmount?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  isActive?: boolean;
  imageUrl?: string;
  contributions?: Array<{
    id?: string;
    campaignId?: string;
    contributorId?: string;
    contributorName?: string;
    amount?: number;
    message?: string;
    paymentStatus?: string;
    paymentId?: string;
    paymentMethod?: string;
    createdAt?: string;
  }>;
  createdAt?: string;
}

// Type for country validation
type Country = 'mozambique' | 'rwanda';

// Helper function to validate country
const isValidCountry = (country: string): country is Country => {
  return country === 'mozambique' || country === 'rwanda';
};

// Create the context
export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: React.ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const typedUser = user as { id: string; email: string; firstName: string; lastName: string; country: 'mozambique' | 'rwanda' } | null;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Exchange rates
  const exchangeRates = useMemo(() => ({
    MZN_to_RWF: 18.5,
    RWF_to_MZN: 0.054
  }), []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load campaigns
        const campaignResult = await ApiService.getCampaigns();
        if (campaignResult && campaignResult.success) {
          // Map API response to our Campaign type
          const mappedCampaigns = (campaignResult.campaigns as ApiCampaign[]).map(campaign => ({
            id: campaign.id || '',
            title: campaign.title || '',
            description: campaign.description || '',
            targetAmount: campaign.goalAmount || campaign.targetAmount || 0,
            currency: (campaign.currency === 'MZN' || campaign.currency === 'RWF') 
              ? campaign.currency as 'MZN' | 'RWF' 
              : 'MZN',
            creatorId: campaign.creatorId || '',
            creatorName: campaign.creatorName || '',
            raisedAmount: campaign.raisedAmount || 0,
            startDate: campaign.startDate || new Date().toISOString(),
            endDate: campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: (campaign.status === 'active' || campaign.status === 'completed' || campaign.status === 'cancelled' 
              ? campaign.status 
              : (campaign.isActive ? 'active' : 'completed')) as 'active' | 'completed' | 'cancelled',
            contributions: Array.isArray(campaign.contributions) 
              ? campaign.contributions.map(contribution => ({
                  id: contribution.id || '',
                  campaignId: contribution.campaignId || '',
                  contributorId: contribution.contributorId || '',
                  contributorName: contribution.contributorName || 'Anonymous',
                  amount: contribution.amount || 0,
                  message: contribution.message,
                  paymentStatus: (contribution.paymentStatus === 'completed' ? 'completed' : 
                                contribution.paymentStatus === 'failed' ? 'failed' : 'pending') as 'pending' | 'completed' | 'failed',
                  paymentId: contribution.paymentId,
                  paymentMethod: contribution.paymentMethod,
                  createdAt: contribution.createdAt || new Date().toISOString()
                })) 
              : [],
            imageUrl: campaign.imageUrl,
            createdAt: campaign.createdAt || new Date().toISOString()
          }));
          setCampaigns(mappedCampaigns);
        }
        
        // Load user transactions if logged in
        if (user?.id) {
          const txResult = await ApiService.getUserTransactions();
          if (txResult.success && Array.isArray(txResult.transactions)) {
            setTransactions(txResult.transactions);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const calculateFee = useCallback((amount: number): number => {
    return Math.max(10, amount * 0.05); // 5% fee with minimum of 10 units
  }, []);

  const convertCurrency = useCallback(
    (
      amount: number,
      fromCurrency: 'MZN' | 'RWF',
      toCurrency: 'MZN' | 'RWF'
    ): number => {
      if (fromCurrency === toCurrency) return amount;
      const rate = fromCurrency === 'MZN' ? exchangeRates.MZN_to_RWF : exchangeRates.RWF_to_MZN;
      return fromCurrency === 'MZN' ? amount * rate : amount * rate;
    },
    [exchangeRates]
  );

  const updateTransactionStatus = useCallback(async (
    transactionId: string,
    status: Transaction['status'],
    paymentData?: { paymentId?: string; paymentMethod?: string }
  ): Promise<Transaction | undefined> => {
    // Find the transaction first
    const txToUpdate = transactions.find(tx => tx.id === transactionId);
    if (!txToUpdate) return undefined;
    
    // Create the updated transaction
    const updatedTx: Transaction = {
      ...txToUpdate,
      status,
      paymentId: paymentData?.paymentId || txToUpdate.paymentId,
      paymentMethod: paymentData?.paymentMethod || txToUpdate.paymentMethod,
      completedAt: status === 'completed' ? new Date().toISOString() : txToUpdate.completedAt
    };
    
    // Update the state
    setTransactions(prev => 
      prev.map(tx => (tx.id === transactionId ? updatedTx : tx))
    );
    
    return updatedTx;
  }, [transactions]);

  const getCampaignById = useCallback((id: string): Campaign | null => {
    return campaigns.find(c => c.id === id) || null;
  }, [campaigns]);

  const createCampaign = useCallback(async (data: {
    title: string;
    description: string;
    targetAmount: number;
    currency: 'MZN' | 'RWF';
    endDate: string;
    imageUrl?: string;
  }): Promise<string | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const result = await ApiService.createCampaign({
        title: data.title,
        description: data.description,
        goalAmount: data.targetAmount,
        currency: data.currency,
        endDate: data.endDate,
        imageUrl: data.imageUrl,
        withdrawalNumber: '', // These should be provided by the user
        withdrawalMethod: 'bank_transfer' // Default value, should be configurable
      });

      if (result.success) {
        const newCampaign: Campaign = {
          ...data,
          id: result.campaignId,
          creatorId: typedUser?.id || '',
          creatorName: typedUser?.firstName || '',
          raisedAmount: 0,
          startDate: new Date().toISOString(),
          status: 'active',
          contributions: [],
          createdAt: new Date().toISOString(),
          imageUrl: data.imageUrl
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
  }, [user, typedUser?.id, typedUser?.firstName]);

  const contributeToCampaign = useCallback(async (
    campaignId: string,
    data: {
      amount: number;
      currency: 'MZN' | 'RWF';
      message?: string;
      anonymous?: boolean;
    }
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      
      // Prepare the contribution data for the API call
      const contributionData = {
        amount: data.amount,
        currency: data.currency,
        message: data.message,
        anonymous: data.anonymous,
        contributorId: typedUser?.id || '',
        contributorName: typedUser?.firstName || 'Anonymous',
        paymentMethod: 'card' as const
      };

      // Make the API call
      const result = await ApiService.contributeToCampaign(campaignId, contributionData);

      if (result.success) {
        const newContribution: Contribution = {
          id: result.contributionId,
          campaignId,
          contributorId: typedUser?.id || '',
          contributorName: data.anonymous ? 'Anonymous' : (typedUser?.firstName || 'Anonymous'),
          amount: data.amount,
          message: data.message,
          paymentStatus: 'pending',
          paymentMethod: 'card',
          createdAt: new Date().toISOString()
        };

        // Update local state
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId
              ? {
                  ...campaign,
                  contributions: [...campaign.contributions, newContribution],
                  raisedAmount: campaign.raisedAmount + data.amount
                }
              : campaign
          )
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
  }, [user, typedUser?.id, typedUser?.firstName]);

  const updateCampaignContribution = useCallback(async (
    contributionId: string, 
    paymentData: { status: 'completed' | 'failed'; paymentId?: string }
  ) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        const contribution = campaign.contributions.find(c => c.id === contributionId);
        if (!contribution) return campaign;

        const updatedContributions = campaign.contributions.map(c => 
          c.id === contributionId 
            ? { 
                ...c, 
                paymentStatus: paymentData.status,
                paymentId: paymentData.paymentId || c.paymentId 
              } 
            : c
        );

        return {
          ...campaign,
          contributions: updatedContributions,
          raisedAmount: paymentData.status === 'completed'
            ? campaign.raisedAmount + (contribution.amount || 0)
            : campaign.raisedAmount
        };
      })
    );
  }, []);

  const sendMoney = useCallback(async (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type' | 'convertedAmount' | 'convertedCurrency' | 'exchangeRate' | 'fee' | 'totalAmount' | 'isLocal'>) => {
    // Ensure recipientCountry is valid
    if (!isValidCountry(data.recipientCountry)) {
      throw new Error('Invalid recipient country. Must be either "mozambique" or "rwanda"');
    }
    if (!user) return false;

    try {
      setLoading(true);
      setError('');

      const amount = Number(data.amount);
      const fee = calculateTransactionFee(amount);
      const totalAmount = amount + fee;
      const reference = generateTransactionReference();
      
      // Ensure recipientCountry is one of the allowed values
      const recipientCountry = (data.recipientCountry === 'mozambique' || data.recipientCountry === 'rwanda') 
        ? data.recipientCountry 
        : 'mozambique';

      const transactionData = {
        ...data,
        recipientCountry,
        amount,
        fee,
        totalAmount,
        convertedAmount: amount,
        convertedCurrency: data.currency,
        exchangeRate: data.currency === 'MZN' ? exchangeRates.MZN_to_RWF : exchangeRates.RWF_to_MZN,
        senderId: typedUser?.id || '',
        reference,
        paymentId: '',
        paymentMethod: 'card',
        status: 'pending' as const,
        type: 'send' as const,
        isLocal: false,
        createdAt: new Date().toISOString(),
        recipientEmail: data.recipientEmail || ''
      };

      // Add to local state immediately for optimistic UI
      const localTransaction: Transaction = {
        ...transactionData,
        id: 'local-' + reference,
        status: 'processing'
      };
      
      setTransactions(prev => [localTransaction, ...prev]);

      // Process the transaction
      const result = await ApiService.createTransaction(transactionData);
      
      if (result.success) {
        // Update local transaction with server data
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === localTransaction.id 
              ? { ...tx, id: result.transactionId, status: 'completed' as const } 
              : tx
          )
        );
        return true;
      } else {
        // Mark as failed if API call fails
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === localTransaction.id 
              ? { ...tx, status: 'failed' as const, error: result.error } 
              : tx
          )
        );
        setError(result.error || 'Failed to send money');
        return false;
      }
    } catch (error) {
      console.error('Error sending money:', error);
      setError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, exchangeRates, typedUser?.id]);

  // Create context value with all the functions and state
  const contextValue: TransactionContextType = {
    transactions,
    campaigns,
    exchangeRates,
    MZN_to_RWF: exchangeRates.MZN_to_RWF,
    RWF_to_MZN: exchangeRates.RWF_to_MZN,
    loading,
    error,
    sendMoney,
    createCampaign,
    contributeToCampaign,
    getCampaignById,
    calculateFee,
    convertCurrency,
    updateTransactionStatus,
    updateCampaignContribution
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionProvider;
