// src/types/transaction.ts
export interface Transaction {
    id: string;
    senderId: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone: string;
    recipientCountry: string;
    amount: number;
    currency: 'MZN' | 'RWF';
    convertedAmount?: number;
    convertedCurrency?: 'MZN' | 'RWF';
    exchangeRate?: number;
    fee?: number;
    totalAmount?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    type: 'send' | 'receive' | 'deposit' | 'withdraw';
    paymentMethod?: string;
    paymentId?: string;
    reference: string;
    description?: string;
    createdAt: string;
    completedAt?: string;
    isLocal?: boolean;
  }
  
  export interface Campaign {
    id: string;
    creatorId: string;
    creatorName: string;
    title: string;
    description: string;
    targetAmount: number;
    goalAmount?: number; // For backward compatibility
    raisedAmount: number;
    currency: 'MZN' | 'RWF';
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'cancelled';
    isActive?: boolean; // For backward compatibility
    imageUrl?: string;
    contributions: Contribution[];
    createdAt: string;
  }
  
  export interface Contribution {
    id: string;
    campaignId: string;
    contributorId: string;
    contributorName: string;
    amount: number;
    message?: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
    paymentId?: string;
    paymentMethod?: string;
    createdAt: string;
    anonymous?: boolean;
    currency?: 'MZN' | 'RWF';
  }

  export interface ContributionInput {
    amount: number;
    currency: 'MZN' | 'RWF';
    message?: string;
    anonymous?: boolean;
    contributorId: string;
    contributorName: string;
    paymentMethod: string;
  }

  export interface TransactionContextType {
    transactions: Transaction[];
    campaigns: Campaign[];
    exchangeRates: { MZN_to_RWF: number; RWF_to_MZN: number };
    MZN_to_RWF: number;
    RWF_to_MZN: number;
    loading: boolean;
    error: string;
    sendMoney: (data: Omit<Transaction, 'id' | 'senderId' | 'status' | 'createdAt' | 'reference' | 'type' | 'convertedAmount' | 'convertedCurrency' | 'exchangeRate' | 'fee' | 'totalAmount' | 'isLocal'>) => Promise<boolean>;
    createCampaign: (data: {
      title: string;
      description: string;
      targetAmount: number;
      currency: 'MZN' | 'RWF';
      endDate: string;
      imageUrl?: string;
    }) => Promise<string | null>;
    contributeToCampaign: (campaignId: string, data: ContributionInput) => Promise<string | null>;
    getCampaignById: (id: string) => Campaign | null;
    calculateFee: (amount: number) => number;
    convertCurrency: (amount: number, fromCurrency: 'MZN' | 'RWF', toCurrency: 'MZN' | 'RWF') => number;
    updateTransactionStatus: (transactionId: string, status: Transaction['status'], paymentData?: { paymentId?: string; paymentMethod?: string }) => void;
    updateCampaignContribution: (contributionId: string, paymentData: { status: 'completed' | 'failed'; paymentId?: string }) => void;
  }