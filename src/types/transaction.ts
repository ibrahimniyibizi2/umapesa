// src/types/transaction.ts

// API Response Types
export interface ApiContribution {
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
}

export interface ApiCampaign {
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
  contributions?: ApiContribution[];
  createdAt?: string;
  withdrawalNumber?: string;
  withdrawalMethod?: string;
}

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
    startDate?: string;
    endDate: string;
    status?: 'active' | 'completed' | 'cancelled';
    isActive?: boolean; // For backward compatibility
    imageUrl?: string;
    withdrawalNumber?: string;
    withdrawalMethod?: 'm-pesa' | 'airtel-money' | 'mpamba';
    contributions?: Contribution[];
    createdAt?: string;
    updatedAt?: string;
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
      goalAmount: number;
      currency: 'MZN' | 'RWF';
      endDate?: string;
      imageUrl?: string;
      withdrawalNumber: string;
      withdrawalMethod: string;
    }) => Promise<{ success: boolean; campaignId?: string; error?: string }>;
    contributeToCampaign: (campaignId: string, data: ContributionInput) => Promise<string | null>;
    getCampaignById: (id: string) => Campaign | null;
    calculateFee: (amount: number) => number;
    convertCurrency: (amount: number, fromCurrency: 'MZN' | 'RWF', toCurrency: 'MZN' | 'RWF') => number;
    updateTransactionStatus: (transactionId: string, status: Transaction['status'], paymentData?: { paymentId?: string; paymentMethod?: string }) => void;
    updateCampaignContribution: (contributionId: string, paymentData: { status: 'completed' | 'failed'; paymentId?: string }) => void;
  }